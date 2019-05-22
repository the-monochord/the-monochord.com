import React, { Fragment } from 'react'
import { filter, propEq, compose, findIndex } from 'ramda'
import { withRouter } from 'react-router-dom'
import { withTranslation } from 'react-i18next'
import shortid from 'shortid'
import isomorphicConnect from '../../../../helpers/isomorphicConnect'
import { actions as draftActions } from '../../../../reducers/drafts'
import Button from '../../Button'
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

const Project = props => {
  const { activeDraftIndex, activeDraft, setTitle, addTrack, removeTrack, addBar, removeBar, moveBar } = props
  const { tracks = [], bars = [], title = '' } = activeDraft
  return (
    <div className={'Project'}>
      <div>
        <input
          type="text"
          placeholder="Untitled project"
          value={title}
          onChange={e =>
            setTitle({
              projectIdx: activeDraftIndex,
              title: e.target.value
            })
          }
        />
      </div>
      {tracks.map(track => (
        <Fragment key={track.id}>
          <Track
            {...track}
            bars={filter(propEq('trackId', track.id), bars)}
            {...{ addBar, removeBar, moveBar, projectIdx: activeDraftIndex }}
          />
          <Button
            onClick={() => removeTrack({ projectIdx: activeDraftIndex, trackId: track.id })}
            label={'remove track'}
          />
        </Fragment>
      ))}
      <br />
      <Button
        onClick={() => addTrack({ projectIdx: activeDraftIndex, channels: 2, trackId: shortid.generate() })}
        label={'add track'}
      />
    </div>
  )
}

export default enhance(Project)
