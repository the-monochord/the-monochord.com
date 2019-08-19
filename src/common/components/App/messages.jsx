import React from 'react'
import { Trans } from 'react-i18next'
import { TYPE as NOTIFICATION_TYPE } from './Notifications'

const midiNotSupported = {
  title: (
    <Trans i18nKey="Messages:NoMidi-Title">
      <a href="https://www.w3.org/TR/webmidi/">Web MIDI API</a> is not supported in this browser!
    </Trans>
  ),
  detail: (
    <Trans i18nKey="Messages:NoMidi-Detail">
      To see, which browsers support the Web MIDI API, please visit{' '}
      <a href="https://caniuse.com/#feat=midi">https://caniuse.com/#feat=midi</a>!
    </Trans>
  ),
  type: NOTIFICATION_TYPE.WARNING
}

const audioNotSupported = {
  title: (
    <Trans i18nKey="Messages:NoAudio-Title">
      <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">Web Audio API</a> is not supported in
      this browser!
    </Trans>
  ),
  detail: (
    <Trans i18nKey="Messages:NoAudio-Detail">
      To see, which browsers support Web Audio API, please visit{' '}
      <a href="https://caniuse.com/#feat=audio-api">https://caniuse.com/#feat=audio-api</a>!
    </Trans>
  ),
  type: NOTIFICATION_TYPE.WARNING
}

export { midiNotSupported, audioNotSupported }
