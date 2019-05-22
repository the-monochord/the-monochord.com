/* global fetch */
import { restartSocket } from '../../client/websocket'

const requestSessionCookie = store => next => action => {
  if (action.type !== 'system/requestSessionCookie') {
    return next(action)
  }

  fetch('/cookie', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cookie: action.payload.cookie
    })
  }).then(res => {
    restartSocket()
  })

  return next({ type: 'noop' })
}

export default requestSessionCookie
