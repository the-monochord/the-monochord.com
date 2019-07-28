import React, { useContext } from 'react'
import { withTranslation } from 'react-i18next'
import { withRouter } from 'react-router-dom'
import { compose, isNil, find, propEq } from 'ramda'
import { Unless } from 'react-if'
import shortid from 'shortid'
import moment from 'moment'
import isomorphicConnect from '../../../helpers/isomorphicConnect'
import { actions as draftActions } from '../../../reducers/drafts'
import { actions as stateActions } from '../../../reducers/state'
import Button from '../Button'
import AudioContext from '../../../contexts/AudioContext'
import Project from './Project'

const enhance = compose(
  withRouter,
  isomorphicConnect(
    state => ({
      drafts: state.drafts.projects,
      activeDraft: find(propEq('isActive', true), state.drafts.projects),
      isPlaying: state.state.isPlaying,
      isAudioEnabled: state.state.isAudioEnabled
    }),
    {
      ...draftActions,
      ...stateActions
    }
  ),
  withTranslation(['Main'])
)

const Main = props => {
  const {
    t,
    match: {
      params: { hash, revision }
    },
    drafts,
    deleteDraft,
    createDraft,
    makeDraftActive,
    activeDraft,
    isPlaying,
    playDraft,
    pauseDraft,
    isAudioEnabled
  } = props

  const audio = useContext(AudioContext)

  return (
    <div className={'Main'}>
      {t('Main app')}
      <Unless condition={isNil(hash)}>{` - ${hash}`}</Unless>
      <Unless condition={isNil(revision)}>{` - ${revision}`}</Unless>
      <hr />
      Drafts
      <ul>
        {drafts.map(({ title, isActive }, projectIdx) => (
          <li key={projectIdx}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => {
                if (!isActive) {
                  makeDraftActive({ projectIdx })
                }
              }}
            />
            {title || <i>untitled</i>}
            <Button onClick={() => deleteDraft({ projectIdx })} label={'delete'} />
          </li>
        ))}
      </ul>
      <Button
        onClick={() => {
          const trackId = shortid.generate()
          createDraft({ trackId, name: trackId })
        }}
        label={'create new draft'}
      />
      <hr />
      <Button
        disabled={!isAudioEnabled}
        label={isPlaying ? 'pause' : 'play'}
        onClick={() => {
          if (isPlaying) {
            pauseDraft()
          } else {
            playDraft()
          }
        }}
      />
      <Button
        disabled={!isAudioEnabled}
        label={'save as wav'}
        onClick={() => {
          audio.renderToWav(`${activeDraft.title || 'monochord-demo'}-${moment().format('YYYY-M-D-H-m-s')}.wav`)
        }}
      />
      <hr />
      <Unless condition={isNil(activeDraft)}>
        <Project activeDraft={activeDraft} />
      </Unless>
    </div>
  )
}

export default enhance(Main)
