import { propEq, isNil, filter, compose, forEach, map, add, flatten, evolve, startsWith, findIndex } from 'ramda'
import AudioContext from '../contexts/AudioContext'
import { actions as draftActions } from '../reducers/drafts'
import { roundToNDecimals } from '../helpers/number'
// import { actions as stateActions } from '../reducers/state'

const { setCursorPosition } = draftActions
// const { pauseDraft } = stateActions

let cursorAtInterval = null

const audioLinker = store => next => action => {
  const audio = AudioContext._currentValue

  const result = next(action)
  const {
    state: { isPlaying },
    drafts: { projects }
  } = store.getState()

  const activeProjectIdx = findIndex(propEq('isActive', true), projects)
  const activeProject = projects[activeProjectIdx]

  if (action.type === 'state/enableAudio' || startsWith('drafts/', action.type)) {
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
  } else {
    switch (action.type) {
      case 'state/playDraft':
        {
          const cursorAt = isNil(activeProject) ? 0 : activeProject.cursorAt
          audio.play(cursorAt)

          if (cursorAtInterval !== null) {
            clearInterval(cursorAtInterval)
          }
          cursorAtInterval = setInterval(() => {
            const {
              drafts: { projects }
            } = store.getState()
            const activeProjectIdx = findIndex(propEq('isActive', true), projects)
            const activeProject = projects[activeProjectIdx]
            const cursorAt = isNil(activeProject) ? 0 : activeProject.cursorAt
            // TODO: need to prevent history/add
            store.dispatch(
              setCursorPosition({
                projectIdx: activeProjectIdx,
                cursorAt: roundToNDecimals(3, cursorAt + 1) // TODO: ctx.currentTime would be more accurate
              })
            )
          }, 500)
        }
        break
      case 'state/pauseDraft':
        {
          const cursorAt = audio.pause()

          if (cursorAtInterval !== null) {
            clearInterval(cursorAtInterval)
            cursorAtInterval = null
          }

          store.dispatch(
            setCursorPosition({
              projectIdx: activeProjectIdx,
              cursorAt: roundToNDecimals(3, cursorAt)
            })
          )
        }
        break
      case 'state/stopDraft':
        audio.pause()
        store.dispatch(
          setCursorPosition({
            projectIdx: activeProjectIdx,
            cursorAt: 0
          })
        )
        break
    }
  }

  return result
}

export default audioLinker
