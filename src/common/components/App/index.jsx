import React, { useContext, createRef } from 'react'
import cn from 'classnames'
import { isEmpty } from 'ramda'
import { useTranslation } from 'react-i18next'
import { Route, Switch } from 'react-router-dom'
import { When, Unless, If, Then, Else } from 'react-if'
import routes from '../../config/routes'
import { actions as stateActions } from '../../reducers/state'
import { actions as midiActions } from '../../reducers/midi'
import { actions as historyActions } from '../../reducers/history'
import MidiContext from '../../contexts/MidiContext'
import AudioContext from '../../contexts/AudioContext'
import { useEffectOnce, useNamespaceSelector, useSelector, useDispatch, useEffectSkipFirst } from '../../helpers/react'
import { forceSocketReconnect } from '../../../client/websocket'
import Settings from './Settings'
import Notifications from './Notifications'
import Navigation from './Navigation'
import MidiEnabler from './MidiEnabler'
import AudioEnabler from './AudioEnabler'
import Button from './Button'
import { audioNotSupported, midiNotSupported } from './messages'
import s from './style.scss'

const { addNotification, enableAudio, enableMidi, pressHotkey, setSocketReconnectTime } = stateActions
const { noteOn, noteOff, sustainOn, sustainOff } = midiActions
const { undo, redo } = historyActions

const App = props => {
  const { t } = useTranslation(['App'])
  const { theme } = useNamespaceSelector('settings', ['theme'])
  const { isLoggedIn, profileName, profilePicture } = useNamespaceSelector('user', [
    'isLoggedIn',
    'profileName',
    'profilePicture'
  ])
  const { isOnline, socketReconnectTime } = useNamespaceSelector('state', ['isOnline', 'socketReconnectTime'])
  const { canUndo, canRedo } = useSelector(state => ({
    canUndo: !isEmpty(state.history.prevs),
    canRedo: !isEmpty(state.history.nexts)
  }))

  const dispatch = useDispatch()

  const midi = useContext(MidiContext)
  const audio = useContext(AudioContext)

  useEffectOnce(() => {
    if (midi.isSupported()) {
      midi
        .on('note on', note => dispatch(noteOn({ noteIdx: note })))
        .on('note off', note => dispatch(noteOff({ noteIdx: note })))
        .on('sustain on', () => dispatch(sustainOn()))
        .on('sustain off', () => dispatch(sustainOff()))
    } else {
      dispatch(addNotification(midiNotSupported))
    }

    if (!audio.isSupported()) {
      dispatch(addNotification(audioNotSupported))
    }
  })

  useEffectSkipFirst(() => {
    if (socketReconnectTime > 0) {
      const t = setTimeout(() => {
        dispatch(
          setSocketReconnectTime({
            socketReconnectTime: socketReconnectTime - 1
          })
        )
      }, 1000)

      return () => {
        clearTimeout(t)
      }
    }
  }, [socketReconnectTime])

  const AppRef = createRef()

  return (
    <div
      className={cn(s.App, `theme-${theme}`)}
      tabIndex={0}
      ref={AppRef}
      onKeyDown={e => {
        if (!e.repeat && e.target === AppRef.current) {
          dispatch(
            pressHotkey({
              key: e.key
            })
          )
        }
      }}
    >
      <div>
        <header>
          <MidiEnabler midi={midi} onReady={() => dispatch(enableMidi())} />
          <br />
          <br />
          <AudioEnabler audio={audio} onReady={() => dispatch(enableAudio())} />
          <br />
          <hr />
          <br />
          <If condition={isOnline}>
            <Then>online</Then>
            <Else>
              offline
              <If condition={socketReconnectTime > 0}>
                <Then>
                  <small>reconnecting in {socketReconnectTime} seconds</small>
                  <Button
                    label={'click here to reconnect now'}
                    onClick={() => {
                      forceSocketReconnect()
                    }}
                  />
                </Then>
                <Else>reconnecting &hellip;</Else>
              </If>
            </Else>
          </If>
          <When condition={isLoggedIn}>
            <div>
              <Unless condition={isEmpty(profilePicture)}>
                <img src={profilePicture} width="50" height="50" />
              </Unless>
              {t('Welcome, {{name}}!', { name: profileName })}
            </div>
          </When>
          <Navigation />
        </header>
        <Switch>
          {routes.map(({ path, exact, component: Component, ...rest }) => (
            <Route
              key={path}
              path={path}
              exact={exact}
              render={({ match: { params } }) => <Component {...rest} {...params} />}
            />
          ))}
        </Switch>
        <hr />
        <Button disabled={!canUndo} label={'UNDO'} onClick={() => dispatch(undo())} />
        <Button disabled={!canRedo} label={'REDO'} onClick={() => dispatch(redo(/* */))} />
        <Settings />
        <Notifications />
      </div>
    </div>
  )
}

export default App
