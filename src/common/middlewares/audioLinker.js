import { find, propEq, isNil, filter, compose, forEach, pluck, flatten } from 'ramda'
import AudioContext from '../contexts/AudioContext'

const audioLinker = store => next => action => {
  const audio = AudioContext._currentValue

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
    case 'drafts/makeDraftActive':
    case 'state/enableAudio':
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
              events: flatten(pluck('events', filter(propEq('trackId', trackId), activeProject.bars)))
            })
          )
        )(activeProject.tracks)
      }
      break
  }

  return next(action)
}

export default audioLinker
