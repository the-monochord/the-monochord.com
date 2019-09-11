import { find, propEq, isNil, filter, compose, forEach, map, add, flatten, evolve, startsWith } from 'ramda'
import AudioContext from '../contexts/AudioContext'

const audioLinker = store => next => action => {
  const audio = AudioContext._currentValue

  if (action.type === 'state/enableAudio' || startsWith('drafts/', action.type)) {
    const result = next(action)
    const {
      drafts: { projects }
    } = store.getState()

    const activeProject = find(propEq('isActive', true), projects)

    if (!isNil(activeProject)) {
      audio.stop()

      forEach(
        compose(
          ({ instrument, events }) => {
            audio.setInstrument(instrument)
            audio.setEvents(instrument, events)
          },
          ({ id: trackId }) => ({
            instrument: trackId,
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
        audio.play()
        break
      case 'state/pauseDraft':
        audio.pause()
        break
      case 'state/stopDraft':
        audio.stop()
        break
    }
  }

  return next(action)
}

export default audioLinker
