import React from 'react'
import { TYPE as NOTIFICATION_TYPE } from './Notifications'

const midiNotSupported = {
  title: (
    <>
      <a href="https://www.w3.org/TR/webmidi/">Web MIDI API</a> is not supported
    </>
  ),
  detail: (
    <>
      To see, which browsers support the Web MIDI API, please visit{' '}
      <a href="https://caniuse.com/#feat=midi">https://caniuse.com/#feat=midi</a>
    </>
  ),
  type: NOTIFICATION_TYPE.WARNING
}

const audioNotSupported = {
  title: (
    <>
      <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">Web Audio API</a> is not supported in
      this browser!
    </>
  ),
  detail: (
    <>
      To see, which browsers support Web Audio API, please visit{' '}
      <a href="https://caniuse.com/#feat=audio-api">https://caniuse.com/#feat=audio-api</a>
    </>
  ),
  type: NOTIFICATION_TYPE.WARNING
}

export { midiNotSupported, audioNotSupported }
