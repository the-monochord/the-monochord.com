import React, { useContext } from 'react'
import { isNil, isEmpty } from 'ramda'
import { If, Then, Else } from 'react-if'
import MidiEnabler from '../MidiEnabler'
import AudioEnabler from '../AudioEnabler'
import Button from '../Button'
import { useNamespaceSelector, useDispatch } from '../../../helpers/react'
import { forceSocketReconnect } from '../../../../client/websocket'
import { actions as stateActions } from '../../../reducers/state'
import MidiContext from '../../../contexts/MidiContext'
import AudioContext from '../../../contexts/AudioContext'

const { enableAudio, enableMidi } = stateActions

const Header = props => {
  const { isLoggedIn, displayName, picture } = useNamespaceSelector('user', ['isLoggedIn', 'displayName', 'picture'])
  const { staticPath } = useNamespaceSelector('constants', ['staticPath'])
  const { isOnline, socketReconnectTime } = useNamespaceSelector('state', ['isOnline', 'socketReconnectTime'])

  const dispatch = useDispatch()
  const midi = useContext(MidiContext)
  const audio = useContext(AudioContext)

  return (
    <header>
      {displayName}
      <img
        src={!isLoggedIn || isNil(picture) || isEmpty(picture) ? `${staticPath}/img/empty-profile-pic.jpg` : picture}
        width="40"
        height="40"
      />

      <MidiEnabler midi={midi} onReady={() => dispatch(enableMidi())} />
      <AudioEnabler audio={audio} onReady={() => dispatch(enableAudio())} />

      <If condition={isOnline}>
        <Then>online</Then>
        <Else>
          offline
          <If condition={socketReconnectTime > 0}>
            <Then>
              <small>reconnecting in {socketReconnectTime} seconds</small>
              <Button
                label="click here to reconnect now"
                onClick={() => {
                  forceSocketReconnect()
                }}
              />
            </Then>
            <Else>reconnecting &hellip;</Else>
          </If>
        </Else>
      </If>
    </header>
  )
}

export default Header
