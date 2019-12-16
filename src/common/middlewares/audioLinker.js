import {
  propEq,
  isNil,
  filter,
  compose,
  forEach,
  map,
  add,
  flatten,
  evolve,
  startsWith,
  findIndex,
  mergeDeepRight,
  pathOr
} from 'ramda'
import { audio } from '../contexts/AudioContext'
import { actions as draftActions } from '../reducers/drafts'
import { roundToNDecimals } from '../helpers/number'
import { PAYLOAD_FLAGS } from '../helpers/flags'
import { actions as stateActions } from '../reducers/state'

const { setCursorPosition } = draftActions
const { pauseDraft } = stateActions

let cursorAtInterval = null

const audioLinker = store => next => action => {
  const result = next(action)
  const {
    state: { isPlaying },
    drafts: { projects }
  } = store.getState()

  const activeProjectIdx = findIndex(propEq('isActive', true), projects)
  const activeProject = projects[activeProjectIdx]

  if (action.type === 'state/enableAudio' || startsWith('drafts/', action.type)) {
    if (!isNil(activeProject)) {
      if (isPlaying && !pathOr(false, ['payload', PAYLOAD_FLAGS.FEEDBACK], action)) {
        store.dispatch(pauseDraft())
      }

      forEach(
        compose(
          ({ instrument, volume, events }) => {
            audio.setInstrument(instrument, volume)
            if (action.type === 'drafts/setTrackProperty') {
              audio.setProperties(instrument, {
                volume
              })
            }
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
            store.dispatch(
              mergeDeepRight(
                setCursorPosition({
                  projectIdx: activeProjectIdx,
                  cursorAt: roundToNDecimals(3, audio.cursorAt())
                }),
                {
                  payload: {
                    [PAYLOAD_FLAGS.FEEDBACK]: true,
                    [PAYLOAD_FLAGS.DONT_ADD_TO_HISTORY]: true,
                    [PAYLOAD_FLAGS.DONT_SYNC_THROUGH_SOCKET]: true
                  }
                }
              )
            )
          }, 100)
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
