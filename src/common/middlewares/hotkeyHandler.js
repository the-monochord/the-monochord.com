import { findIndex, propEq, isNil, clamp } from 'ramda'
import { actions as stateActions } from '../reducers/state'
import { actions as draftActions } from '../reducers/drafts'
import { seekAmountsInSeconds } from '../config/defaults'

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
    case 'Left':
    case 'ArrowLeft': {
      const {
        drafts: { projects }
      } = store.getState()

      const activeProjectIdx = findIndex(propEq('isActive', true), projects)
      const activeProject = projects[activeProjectIdx]
      const cursorAt = isNil(activeProject) ? 0 : activeProject.cursorAt

      return next(
        draftActions.setCursorPosition({
          projectIdx: activeProjectIdx,
          cursorAt: clamp(0, Infinity, cursorAt - seekAmountsInSeconds[action.payload.shift ? 'small' : 'medium'])
        })
      )
    }
    case 'Right':
    case 'ArrowRight': {
      const {
        drafts: { projects }
      } = store.getState()

      const activeProjectIdx = findIndex(propEq('isActive', true), projects)
      const activeProject = projects[activeProjectIdx]
      const cursorAt = isNil(activeProject) ? 0 : activeProject.cursorAt

      return next(
        draftActions.setCursorPosition({
          projectIdx: activeProjectIdx,
          cursorAt: cursorAt + seekAmountsInSeconds[action.payload.shift ? 'small' : 'medium']
        })
      )
    }
  }

  return next({ type: 'noop' })
}

export default hotkeyHandler
