import React, { useContext, createRef } from 'react'
import cn from 'classnames'
import { isEmpty } from 'ramda'
import { Route, Switch } from 'react-router-dom'
import useRouter from 'use-react-router'
import routes from '../../config/routes'
import { actions as stateActions } from '../../reducers/state'
import { actions as midiActions } from '../../reducers/midi'
import { actions as historyActions } from '../../reducers/history'
import { actions as seoActions } from '../../reducers/seo'
import MidiContext from '../../contexts/MidiContext'
import AudioContext from '../../contexts/AudioContext'
import { useEffectOnce, useNamespaceSelector, useSelector, useDispatch, useEffectSkipFirst } from '../../helpers/react'
import Settings from './Settings'
import Notifications from './Notifications'
import Navigation from './Navigation'
import Button from './Button'
import { audioNotSupported, midiNotSupported } from './messages'
import s from './style.scss'
import Header from './Header'

const { addNotification, pressHotkey, setSocketReconnectTime } = stateActions
const { noteOn, noteOff, sustainOn, sustainOff } = midiActions
const { undo, redo } = historyActions
const { setStatus } = seoActions

const App = props => {
  const { theme } = useNamespaceSelector('settings', ['theme'])
  const { socketReconnectTime, isPlaying } = useNamespaceSelector('state', ['socketReconnectTime', 'isPlaying'])
  const { canUndo, canRedo } = useSelector(state => ({
    canUndo: !isEmpty(state.history.prevs),
    canRedo: !isEmpty(state.history.nexts)
  }))

  const dispatch = useDispatch()

  const midi = useContext(MidiContext)
  const audio = useContext(AudioContext)

  const {
    location: { pathname }
  } = useRouter()

  useEffectSkipFirst(() => {
    dispatch({
      type: 'feedback/locationChanged',
      payload: {}
    })
  }, [pathname])

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

  useEffectSkipFirst(() => {
    dispatch(
      setStatus({
        status: isPlaying ? '▶' : ''
      })
    )
  }, [isPlaying])

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
              key: e.key,
              shift: e.shiftKey,
              alt: e.altKey,
              ctrlOrCmd: e.ctrlKey || e.metaKey
            })
          )
        }
      }}
    >
      <div>
        <Header />
        <Navigation />
        <Switch>
          {routes.map(({ path, exact, component: Component, ...rest }) => (
            <Route
              key={path}
              path={path}
              exact={exact}
              render={({ match: { params } }) => {
                return <Component {...rest} {...params} />
              }}
            />
          ))}
        </Switch>
        <hr />
        <Button disabled={!canUndo} label="UNDO" onClick={() => dispatch(undo())} />
        <Button disabled={!canRedo} label="REDO" onClick={() => dispatch(redo())} />
        <Settings />
        <Notifications />
      </div>
    </div>
  )
}

export default App
