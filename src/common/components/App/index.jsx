import React, { useEffect, useContext, createRef } from 'react'
import cn from 'classnames'
import { compose, isEmpty } from 'ramda'
import { withTranslation } from 'react-i18next'
import { Route, Switch, withRouter } from 'react-router-dom'
import { When, Unless, If, Then, Else } from 'react-if'
import isomorphicConnect from '../../helpers/isomorphicConnect'
import routes from '../../config/routes'
import { actions as stateActions } from '../../reducers/state'
import { actions as midiActions } from '../../reducers/midi'
import { actions as historyActions } from '../../reducers/history'
import MidiContext from '../../contexts/MidiContext'
import AudioContext from '../../contexts/AudioContext'
import Settings from './Settings'
import Notifications from './Notifications'
import Navigation from './Navigation'
import MidiEnabler from './MidiEnabler'
import AudioEnabler from './AudioEnabler'
import Button from './Button'
import { audioNotSupported, midiNotSupported } from './messages'
import s from './style.scss'

const enhance = compose(
  withRouter,
  isomorphicConnect(
    state => ({
      ...state.settings,
      isLoggedIn: state.user.isLoggedIn,
      profileName: state.user.displayName,
      profilePicture: state.user.picture,
      isOnline: state.state.isOnline,
      canUndo: !isEmpty(state.history.prevs),
      canRedo: !isEmpty(state.history.nexts)
    }),
    {
      ...stateActions,
      ...midiActions,
      ...historyActions
    }
  ),
  withTranslation(['App'])
)

const App = props => {
  const {
    t,
    theme,
    isLoggedIn,
    profileName,
    profilePicture,
    addNotification,
    isOnline,
    noteOn,
    noteOff,
    sustainOn,
    sustainOff,
    canUndo,
    canRedo,
    undo,
    redo,
    enableAudio,
    enableMidi,
    hotkeyPressed
  } = props

  const midi = useContext(MidiContext)
  const audio = useContext(AudioContext)

  useEffect(() => {
    if (midi.isSupported()) {
      midi
        .on('note on', note => noteOn({ noteIdx: note }))
        .on('note off', note => noteOff({ noteIdx: note }))
        .on('sustain on', sustainOn)
        .on('sustain off', sustainOff)
    } else {
      addNotification(midiNotSupported)
    }

    if (!audio.isSupported()) {
      addNotification(audioNotSupported)
    }
  }, 1)

  const AppRef = createRef()

  return (
    <div
      className={cn(s.App, `theme-${theme}`)}
      tabIndex={0}
      ref={AppRef}
      onKeyDown={e => {
        if (!e.repeat && e.target === AppRef.current) {
          hotkeyPressed({
            key: e.key
          })
        }
      }}
    >
      <div>
        <header>
          <MidiEnabler midi={midi} onReady={enableMidi} />
          <br />
          <br />
          <AudioEnabler audio={audio} onReady={enableAudio} />
          <br />
          <hr />
          <br />
          <If condition={isOnline}>
            <Then>online</Then>
            <Else>
              offline
              <small>reconnecting in {4} seconds</small>
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
        <Button disabled={!canUndo} label={'UNDO'} onClick={undo} />
        <Button disabled={!canRedo} label={'REDO'} onClick={redo} />
        <Settings />
        <Notifications />
      </div>
    </div>
  )
}

export default enhance(App)
