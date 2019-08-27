import { actions as stateActions } from '../reducers/state'

const hotkeyHandler = store => next => action => {
  if (action.type !== 'state/pressHotkey') {
    return next(action)
  }

  switch (action.payload.key) {
    case ' ':
      {
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
      break
    case 'Home':
      {
        const {
          state: { isAudioEnabled }
        } = store.getState()

        if (isAudioEnabled) {
          return next(stateActions.stopDraft())
        }
      }
      break
  }

  return next({ type: 'noop' })
}

export default hotkeyHandler
