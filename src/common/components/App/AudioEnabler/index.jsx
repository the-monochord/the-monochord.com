import React, { useState, useEffect } from 'react'
import ToggleSwitch from '../ToggleSwitch'
import { NOP } from '../../../helpers/function'

const AudioEnabler = props => {
  const { audio, onReady = NOP } = props
  const [isAudioInited, setIsAudioInited] = useState(false)

  useEffect(() => {
    if (audio.isSupported()) {
      audio.on('ready', () => {
        onReady()
      })
    }
  }, 1)

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
