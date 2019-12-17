import { findIndex, propEq } from 'ramda'
import { actions as stateActions } from '../reducers/state'
import { actions as draftActions } from '../reducers/drafts'

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
    case 'Home': {
      const {
        drafts: { projects }
      } = store.getState()

      const activeProjectIdx = findIndex(propEq('isActive', true), projects)

      return next(
        draftActions.setCursorPosition({
          projectIdx: activeProjectIdx,
          cursorAt: 0
        })
      )
    }
  }

  return next({ type: 'noop' })
}

export default hotkeyHandler
