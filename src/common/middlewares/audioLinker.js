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
  }

  return next(action)
}

export default audioLinker
