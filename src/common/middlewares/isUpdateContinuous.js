import { sendSocketMessage } from '../../client/websocket'

const isUpdateContinuous = store => next => action => {
  if (action.type !== 'state/updateModificationTime') {
    return next(action)
  }

  const {
    state: { lastModified }
  } = store.getState()
  const {
    payload: { previousUpdateTime }
  } = action

  if (lastModified === previousUpdateTime) {
    return next(action)
  }

  console.warn(
    `Update continuity failed, got ${previousUpdateTime} from the server, expected ${lastModified} (${
      lastModified - previousUpdateTime > 0 ? '+' : ''
    }${lastModified - previousUpdateTime}). Requesting full state update.`
  )
  sendSocketMessage({
    type: 'fetchCompleteState',
    payload: {}
  })

  return next({ type: 'noop' })
}

export default isUpdateContinuous
