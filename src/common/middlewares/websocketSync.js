import { compose, includes, __ } from 'ramda'
import { sendSocketMessage } from '../../client/websocket'
import { getSliceFromAction } from './helpers'

const isSyncable = compose(
  includes(__, ['settings', 'drafts']),
  getSliceFromAction
)

const websocketSync = store => next => action => {
  const result = next(action)

  if (!action.fromServer && isSyncable(action)) {
    sendSocketMessage(action)
  }

  return result
}

export default websocketSync
