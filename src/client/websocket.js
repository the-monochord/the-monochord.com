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
let retryTimingIndex = 1
const maxRetryTimingIndex = 10
let isOnline = false
let queuedMessages = null

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
    if (!isNil(reconnectTimeout)) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
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
      console.log(`websocket: reconnecting to the server in ${retrySeconds} seconds`)
      reconnectTimeout = setTimeout(() => {
        queuedMessages.off('change', onMessageHandler)
        createSocketClient(store, onMessageHandler)
      }, retrySeconds * 1000)

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

export { createSocketClient, sendSocketMessage, shutdownSocket, restartSocket }
