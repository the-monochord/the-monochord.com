import { compose, includes, __, pathOr } from 'ramda'
import { sendSocketMessage } from '../../client/websocket'
import { PAYLOAD_FLAGS } from '../helpers/flags'
import { getSliceFromAction } from './helpers'

const isSyncable = compose(
  includes(__, ['settings', 'drafts']),
  getSliceFromAction
)

const websocketSync = store => next => action => {
  const result = next(action)

  if (
    !action.fromServer &&
    isSyncable(action) &&
    !pathOr(false, ['payload', PAYLOAD_FLAGS.DONT_SYNC_THROUGH_SOCKET], action)
  ) {
    sendSocketMessage(action)
  }

  return result
}

export default websocketSync
