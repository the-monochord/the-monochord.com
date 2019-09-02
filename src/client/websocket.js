/* global WebSocket */

import { isNil, memoizeWith, toString } from 'ramda'
import { actions as stateActions } from '../common/reducers/state'
import QueuedMessages from './QueuedMessages'

const root5 = Math.sqrt(5)
const phi = (1 + root5) / 2
const nthFibonacci = memoizeWith(toString, n => Math.round(phi ** n / root5 - (1 - phi) ** n / root5))

let wss = null
let shouldTryToReconnect = true
let reconnectTimeout = null
let reconnectInterval = null
let retryTimingIndex = 1
const maxRetryTimingIndex = 10
let isOnline = false
let queuedMessages = null
let canReconnect = false

const stopTimers = () => {
  if (!isNil(reconnectTimeout)) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (!isNil(reconnectInterval)) {
    clearInterval(reconnectInterval)
    reconnectInterval = null
  }
}

const createSocketClient = (store, onMessageHandler) => {
  if (isNil(queuedMessages)) {
    queuedMessages = new QueuedMessages()
  }
  queuedMessages.on('change', onMessageHandler)
  queuedMessages.listen()

  wss = new WebSocket(`wss://localhost:3443`)

  wss.onopen = () => {
    isOnline = true
    store.dispatch(stateActions.turnOnline())
    console.log(`websocket: connected to the server`)
    if (!queuedMessages.isEmpty()) {
      const messages = queuedMessages.getAll()
      queuedMessages.clear()
      console.log('websocket: sending data to the server:', messages)
      wss.send(JSON.stringify(messages))
    }
    retryTimingIndex = 1
  }
  wss.onclose = () => {
    if (isOnline) {
      isOnline = false
      store.dispatch(stateActions.turnOffline())
      console.warn(`websocket: connection closed`)
    }
    wss = null
    if (shouldTryToReconnect) {
      const retrySeconds = nthFibonacci(retryTimingIndex)
      store.dispatch(
        stateActions.setSocketReconnectTime({
          socketReconnectTime: retrySeconds
        })
      )
      console.log(`websocket: reconnecting to the server in ${retrySeconds} seconds`)
      reconnectTimeout = setTimeout(() => {
        canReconnect = true
      }, retrySeconds * 1000)

      reconnectInterval = setInterval(() => {
        if (!canReconnect) {
          return
        }

        canReconnect = false
        stopTimers()
        store.dispatch(
          stateActions.setSocketReconnectTime({
            socketReconnectTime: 0
          })
        )
        queuedMessages.off('change', onMessageHandler)
        createSocketClient(store, onMessageHandler)
      }, 100)

      if (retryTimingIndex < maxRetryTimingIndex) {
        retryTimingIndex++
      }
    }
  }
  wss.onmessage = e => {
    let data = null

    try {
      data = JSON.parse(e.data)
      console.log('websocket: got message from the server:', data)
    } catch (err) {
      console.error(`websocket: failed to parse message from the server:`, e.data)
    }

    if (!isNil(data)) {
      onMessageHandler(data)
    }
  }
}

const sendSocketMessage = data => {
  queuedMessages.add(data)

  if (isOnline) {
    const messages = queuedMessages.getAll()
    queuedMessages.clear()
    console.log('websocket: sending data to the server:', messages)
    wss.send(JSON.stringify(messages))
  } else {
    console.warn('websocket: connection is not ready, queuing message:', data)
  }
}

const shutdownSocket = () => {
  shouldTryToReconnect = false
  if (!isNil(reconnectTimeout)) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  if (!isNil(wss)) {
    wss.close()
  }
}

const restartSocket = () => {
  shouldTryToReconnect = true
  wss.close()
}

const forceSocketReconnect = () => {
  retryTimingIndex = 1
  canReconnect = true
}

export { createSocketClient, sendSocketMessage, shutdownSocket, restartSocket, forceSocketReconnect }
