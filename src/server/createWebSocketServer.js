import { promisify } from 'util'
import {
  equals,
  filter,
  reject,
  isEmpty,
  append,
  reduce,
  any,
  propEq,
  evolve,
  toPairs,
  compose,
  forEach,
  map,
  assoc,
  pick,
  concat,
  complement,
  both
} from 'ramda'
import uuidV4 from 'uuid/v4'
import WebSocket from 'ws'
import { NOP } from '../common/helpers/function'
import combinedReducers from '../common/reducers'
import { isUser, isSelf, bindSessionToWebocketClient } from './sync/helpers'
import { TARGET } from './sync'
import { getSessionData, getTempData, hasSessionCookie, generateSessionCookie } from './helpers'
import { logger } from './log'

const addActionsBasedOnFlags = (client, flags, actions) => {
  const additional = []

  if (flags.needToCheckAndSendSessionCookie) {
    if (!hasSessionCookie(client.req)) {
      additional.push({
        type: 'system/requestSessionCookie',
        payload: {
          cookie: generateSessionCookie(client.req)
        }
      })
    }
  }

  if (flags.needToUpdateTime) {
    const now = Date.now()
    const tempData = getTempData(client.req)
    const previousUpdateTime = tempData.lastModified
    tempData.lastModified = now
    client.req.session._ = tempData

    additional.push({
      type: 'state/updateModificationTime',
      fromServer: true,
      payload: {
        previousUpdateTime,
        currentUpdateTime: now
      }
    })
  }

  if (flags.needToCheckAndSendSessionCookie || flags.needToUpdateTime) {
    // https://stackoverflow.com/a/26000018/1806628
    client.req.session.touch().save()
  }

  return concat(actions, additional)
}

const handleActions = (actions, client, allClients) => {
  logger.info('websocket: got message from client:', actions)

  let reply = {
    [TARGET.SELF]: [],
    [TARGET.USER]: [],
    [TARGET.SPECTATOR]: [],
    [TARGET.COLLABORATOR]: []
  }
  const flags = {
    [TARGET.SELF]: {},
    [TARGET.USER]: {},
    [TARGET.SPECTATOR]: {},
    [TARGET.COLLABORATOR]: {}
  }
  let future = Promise.resolve()

  if (any(propEq('type', 'fetchCompleteState'), actions)) {
    // client needs full state, nothing else matters
    const sessionData = getSessionData(client.req)
    flags[TARGET.SELF].needToUpdateTime = true
    reply = evolve(
      {
        [TARGET.SELF]: append({
          type: 'system/updateFullState',
          payload: sessionData
        })
      },
      reply
    )
  } else {
    // applying action
    future = reduce(
      (moarAsyncness, action) => {
        const sessionData = getSessionData(client.req)
        const newSessionData = pick(
          ['accounts', 'drafts', 'personal', 'settings'],
          combinedReducers(sessionData, action)
        )

        if (equals(sessionData, newSessionData)) {
          // data didn't change, can skip this action
          return moarAsyncness
        }

        if (client.req.isAuthenticated()) {
          // req.login() tells passport.js to update session.user
          moarAsyncness = moarAsyncness.then(() => {
            return promisify(client.req.login.bind(client.req))({
              id: client.req.user.id,
              data: newSessionData
            })
          })
        } else {
          client.req.session.data = newSessionData
        }

        return moarAsyncness.then(() => {
          flags[TARGET.SELF].needToCheckAndSendSessionCookie = true
          flags[TARGET.SELF].needToUpdateTime = true
          flags[TARGET.USER].needToCheckAndSendSessionCookie = true
          flags[TARGET.USER].needToUpdateTime = true

          reply = evolve(
            {
              [TARGET.USER]: append(action)
            },
            reply
          )
        }, NOP)
      },
      future,
      actions
    )
  }

  // handling flags
  future.then(() =>
    compose(
      forEach(([target, flags]) => {
        switch (target) {
          case TARGET.SELF:
            reply[target] = addActionsBasedOnFlags(client, flags, reply[target])
            break
          case TARGET.USER:
            compose(
              forEach(oneOfClients => {
                reply[target] = addActionsBasedOnFlags(oneOfClients, flags, reply[target])
              }),
              filter(both(isUser(client), complement(isSelf(client))))
            )(allClients)
            break
          case TARGET.SPECTATOR:
            break
          case TARGET.COLLABORATOR:
            break
        }
      }),
      toPairs,
      reject(isEmpty)
    )(flags)
  )

  // sending responses
  future.then(() => {
    compose(
      forEach(([target, responses]) => {
        switch (target) {
          case TARGET.SELF:
            logger.info(`websocket: sending messages to client ${client.id}`, responses)
            client.send(JSON.stringify(responses))
            break
          case TARGET.USER:
            compose(
              forEach(oneOfClients => {
                logger.info(`websocket: sending messages to client ${oneOfClients.id}`, responses)
                oneOfClients.send(JSON.stringify(responses))
              }),
              filter(both(isUser(client), complement(isSelf(client))))
            )(allClients)
            break
          case TARGET.SPECTATOR:
            break
          case TARGET.COLLABORATOR:
            break
        }
      }),
      toPairs,
      map(map(assoc('fromServer', true))),
      reject(isEmpty)
    )(reply)
  })
}

const createWebSocketServer = (httpsServer, sessionMiddlewares) => {
  const wss = new WebSocket.Server({ server: httpsServer })

  wss.on('connection', (client, req) => {
    client
      .on('close', () => {
        logger.info(`websocket: client ${client.id} disconnected`)
      })
      .on('message', message => {
        // TODO: wait until client.sessionReady is true
        let actions = []
        try {
          actions = JSON.parse(message)
        } catch (e) {
          logger.error(`websocket: failed to parse message from client ${client.id}: ${e.message}`)
        }

        if (Array.isArray(actions) && !isEmpty(actions)) {
          if (client.sessionReady) {
            handleActions(actions, client, Array.from(wss.clients))
          } else {
            client.actions = concat(client.actions, actions)
          }
        }
      })

    client.id = uuidV4()
    client.sessionReady = false
    client.actions = []
    bindSessionToWebocketClient(sessionMiddlewares, req).then(boundReq => {
      client.req = boundReq
      client.sessionReady = true
      if (!isEmpty(client.actions)) {
        handleActions(client.actions, client, Array.from(wss.clients))
        client.actions = []
      }
    })
    logger.info(`websocket: client connected with id ${client.id}`)
  })

  return wss
}

export default createWebSocketServer
