import { find, propEq, isNil, filter, compose, forEach, map, add, flatten, evolve, startsWith, findIndex } from 'ramda'
import AudioContext from '../contexts/AudioContext'
import { actions as draftActions } from '../reducers/drafts'
// import { actions as stateActions } from '../reducers/state'

const { setCursorPosition } = draftActions
// const { pauseDraft } = stateActions

const audioLinker = store => next => action => {
  const audio = AudioContext._currentValue

  if (action.type === 'state/enableAudio' || startsWith('drafts/', action.type)) {
    const result = next(action)
    const {
      state: { isPlaying },
      drafts: { projects }
    } = store.getState()

    const activeProject = find(propEq('isActive', true), projects)

    if (!isNil(activeProject)) {
      if (isPlaying) {
        // store.dispatch(pauseDraft())
        audio.pause()
      }

      forEach(
        compose(
          ({ instrument, volume, events }) => {
            audio.setInstrument(instrument, volume)
            audio.setEvents(instrument, events)
          },
          ({ id: trackId, volume }) => ({
            instrument: trackId,
            volume,
            events: compose(
              flatten,
              map(({ events, startTime }) =>
                map(
                  evolve({
                    time: add(startTime)
                  })
                )(events)
              ),
              filter(propEq('trackId', trackId))
            )(activeProject.bars)
          })
        )
      )(activeProject.tracks)
    }
    return result
  } else {
    switch (action.type) {
      case 'state/playDraft':
        {
          const {
            drafts: { projects }
          } = store.getState()
          const activeProject = find(propEq('isActive', true), projects)
          const cursorAt = isNil(activeProject) ? 0 : activeProject.cursorAt
          audio.play(cursorAt)
        }
        break
      case 'state/pauseDraft':
        {
          const cursorAt = audio.pause()
          const {
            drafts: { projects }
          } = store.getState()
          store.dispatch(
            setCursorPosition({
              projectIdx: findIndex(propEq('isActive', true), projects),
              cursorAt: cursorAt
            })
          )
        }
        break
      case 'state/stopDraft':
        {
          audio.pause()
          const {
            drafts: { projects }
          } = store.getState()
          store.dispatch(
            setCursorPosition({
              projectIdx: findIndex(propEq('isActive', true), projects),
              cursorAt: 0
            })
          )
        }
        break
    }
  }

  return next(action)
}

export default audioLinker
