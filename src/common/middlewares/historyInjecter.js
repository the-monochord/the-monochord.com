import { last, head, pathOr } from 'ramda'
import { actions as historyActions } from '../reducers/history'
import { capitalize } from '../helpers/string'
import { PAYLOAD_FLAGS } from '../helpers/flags'
import { getSliceFromAction } from './helpers'

const toSetter = slice => `${slice}/set${capitalize(slice)}`

const isUndoable = action => {
  // TODO: generalize this
  const slice = 'drafts'
  return getSliceFromAction(action) === slice && action.type !== toSetter(slice) && !action.fromHistory
}

const historyInjecter = store => next => action => {
  if (isUndoable(action) && !pathOr(false, ['payload', PAYLOAD_FLAGS.DONT_ADD_TO_HISTORY], action)) {
    const slice = getSliceFromAction(action)
    store.dispatch(historyActions.add({ stateBefore: store.getState()[slice], action, slice }))
  }

  if (action.type === 'history/undo') {
    const {
      history: { prevs }
    } = store.getState()

    const { stateBefore, slice } = last(prevs)

    store.dispatch({
      type: toSetter(slice),
      payload: stateBefore
    })

    return next(action)
  }

  if (action.type === 'history/redo') {
    const state = store.getState()

    const { slice, action: redoAction } = head(state.history.nexts)

    action.payload = {
      stateBefore: state[slice]
    }

    store.dispatch({
      ...redoAction,
      fromHistory: true
    })

    return next(action)
  }

  return next(action)
}

export default historyInjecter
