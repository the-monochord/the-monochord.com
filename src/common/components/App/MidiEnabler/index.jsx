import React, { useEffect, useState } from 'react'
import ToggleSwitch from '../ToggleSwitch'
import { NOP } from '../../../helpers/function'

const MidiEnabler = props => {
  const { midi, onReady = NOP } = props
  const [isMidiInited, setIsMidiInited] = useState(false)
  const [isMidiBlocked, setIsMidiBlocked] = useState(false)

  useEffect(() => {
    if (midi.isSupported()) {
      midi
        .on('blocked', () => {
          setIsMidiInited(false)
          setIsMidiBlocked(true)
        })
        .on('ready', () => {
          onReady()
        })
    }
  }, 1)

  return (
    <ToggleSwitch
      className={'MidiEnabler'}
      on={isMidiInited}
      disabled={isMidiInited}
      onChange={() => {
        if (!isMidiInited) {
          if (midi.isSupported()) {
            ;(async () => {
              await midi.init()
            })()
          }
          setIsMidiInited(true)
        }
      }}
      label={`MIDI Enabled${isMidiBlocked ? ' (blocked)' : ''}`}
    />
  )
}

export default MidiEnabler
