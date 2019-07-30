import React, { Fragment } from 'react'
import { filter, propEq, compose, findIndex } from 'ramda'
import { withRouter } from 'react-router-dom'
import { withTranslation } from 'react-i18next'
import shortid from 'shortid'
import isomorphicConnect from '../../../../helpers/isomorphicConnect'
import { actions as draftActions } from '../../../../reducers/drafts'
import Button from '../../Button'
import TextField from '../../TextField'
import DebounceOnChange from '../../DebounceOnChange'
import { roundToNDecimals } from '../../../../helpers/number'
import Track from './Track'

const enhance = compose(
  withRouter,
  isomorphicConnect(
    state => ({
      activeDraftIndex: findIndex(propEq('isActive', true), state.drafts.projects)
    }),
    {
      ...draftActions
    }
  ),
  withTranslation(['Project'])
)

const DebouncedTextField = DebounceOnChange(300, TextField)

const Project = props => {
  const {
    activeDraftIndex,
    activeDraft,
    setTitle,
    addTrack,
    removeTrack,
    setTrackProperty,
    addBar,
    removeBar,
    setCursor
  } = props
  const { tracks = [], bars = [], title = '', cursorAt = 0 } = activeDraft

  return (
    <div className={'Project'}>
      <DebouncedTextField
        placeholder="Untitled project"
        value={title}
        onChange={value => {
          setTitle({
            projectIdx: activeDraftIndex,
            title: value
          })
        }}
      />
      <br />
      cursor at:
      <input
        type="number"
        min="0"
        value={cursorAt}
        onChange={e => {
          // TODO: add debounce
          if (!isNaN(parseFloat(e.target.value))) {
            setCursor({
              projectIdx: activeDraftIndex,
              cursorAt: roundToNDecimals(3, parseFloat(e.target.value))
            })
          }
        }}
      />
      <br />
      {tracks.map(track => (
        <Fragment key={track.id}>
          <Track
            {...track}
            bars={filter(propEq('trackId', track.id), bars)}
            {...{ setTrackProperty, addBar, removeBar, projectIdx: activeDraftIndex, cursorAt }}
          />
          <Button
            onClick={() => removeTrack({ projectIdx: activeDraftIndex, trackId: track.id })}
            label={'remove track'}
          />
        </Fragment>
      ))}
      <br />
      <Button
        onClick={() => {
          const trackId = shortid.generate()
          addTrack({ projectIdx: activeDraftIndex, name: trackId, trackId, volume: 1 })
        }}
        label={'add track'}
      />
    </div>
  )
}

export default enhance(Project)
