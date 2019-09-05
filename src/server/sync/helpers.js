import { curry } from 'ramda'
import { getSessionData, getTempData } from '../helpers'
import { staticPathSecure, mainPathSecure, mode } from '../config'
import { valuesOfSettings } from '../../common/config/defaults'

const generateAppData = req => {
  const { drafts, personal, settings } = getSessionData(req)
  const { lastModified } = getTempData(req)

  return {
    drafts: {
      projects: drafts.projects
    },
    settings,
    user: {
      isLoggedIn: req.isAuthenticated(),
      id: req.isAuthenticated() ? req.user.id : null,
      displayName: req.isAuthenticated() ? personal.displayName : 'Anonymous User',
      picture: req.isAuthenticated() ? personal.picture : null
    },
    constants: {
      staticPath: staticPathSecure,
      mainPath: mainPathSecure,
      valuesOfSettings,
      mode
    },
    seo: {
      themeColor: '#33332b',
      brand: 'The Monochord',
      status: ''
    },
    state: {
      notifications: [],
      lastModified,
      isOnline: false,
      isPlaying: false,
      isAudioEnabled: false,
      isMidiEnabled: false,
      socketReconnectTime: 0
    },
    midi: {
      sustainOn: false,
      noteTable: {}
    },
    history: {
      limit: 3,
      prevs: [],
      nexts: []
    }
  }
}

const isUser = curry((clientA, clientB) => {
  if (clientA.req.isAuthenticated()) {
    return clientB.req.isAuthenticated() && clientA.req.user.id === clientB.req.user.id
  } else {
    return clientA.req.sessionID === clientB.req.sessionID
  }
})

const isSelf = curry((clientA, clientB) => {
  return clientA.id === clientB.id
})

const bindSessionToWebocketClient = curry((sessionMiddlewares, req) => {
  return new Promise(resolve => {
    sessionMiddlewares[0](req, {}, () => {
      sessionMiddlewares[1](req, {}, () => {
        sessionMiddlewares[2](req, {}, () => {
          resolve(req)
        })
      })
    })
  })
})

export { generateAppData, isUser, isSelf, bindSessionToWebocketClient }
