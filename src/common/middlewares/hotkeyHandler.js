import { actions as stateActions } from '../reducers/state'

const hotkeyHandler = store => next => action => {
  if (action.type !== 'state/hotkeyPressed') {
    return next(action)
  }

  if (action.payload.key === ' ') {
    const {
      state: { isAudioEnabled, isPlaying }
    } = store.getState()

    if (isAudioEnabled) {
      if (isPlaying) {
        return next(stateActions.pauseDraft())
      } else {
        return next(stateActions.playDraft())
      }
    }
  }

  return next({ type: 'noop' })
}

export default hotkeyHandler
