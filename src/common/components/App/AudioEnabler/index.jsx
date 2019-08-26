import React, { useState } from 'react'
import ToggleSwitch from '../ToggleSwitch'
import { NOP } from '../../../helpers/function'
import { useEffectOnce } from '../../../helpers/react'

const AudioEnabler = props => {
  const { audio, onReady = NOP } = props
  const [isAudioInited, setIsAudioInited] = useState(false)

  useEffectOnce(() => {
    if (audio.isSupported()) {
      audio.on('ready', () => {
        onReady()
      })
    }
  })

  return (
    <ToggleSwitch
      className={'AudioEnabler'}
      on={isAudioInited}
      disabled={isAudioInited}
      onChange={() => {
        if (!isAudioInited) {
          if (audio.isSupported()) {
            ;(async () => {
              await audio.init()
            })()
          }
          setIsAudioInited(true)
        }
      }}
      label={`Audio Enabled`}
    />
  )
}

export default AudioEnabler
