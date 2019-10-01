import React, { useContext, useCallback } from 'react'
import useRouter from 'use-react-router'
import { isNil, find, propEq, compose, path } from 'ramda'
import { Unless } from 'react-if'
import shortid from 'shortid'
import moment from 'moment'
import { actions as draftActions } from '../../../reducers/drafts'
import { actions as stateActions } from '../../../reducers/state'
import Button from '../Button'
import AudioContext from '../../../contexts/AudioContext'
import { useNamespaceSelector, useSelector, useDispatch } from '../../../helpers/react'
import Checkbox from '../Checkbox'
import Project from './Project'

const { deleteDraft, createDraft, makeDraftActive } = draftActions
const { playDraft, pauseDraft } = stateActions

const Editor = props => {
  const {
    match: {
      params: { hash, revision }
    }
  } = useRouter()
  const { isPlaying, isAudioEnabled } = useNamespaceSelector('state', ['isPlaying', 'isAudioEnabled'])
  const { projects } = useNamespaceSelector('drafts', ['projects'])
  const activeDraft = useSelector(
    compose(
      find(propEq('isActive', true)),
      path(['drafts', 'projects'])
    )
  )
  const dispatch = useDispatch()
  const audio = useContext(AudioContext)

  const onActiveProjectToggle = useCallback(
    (isActive, projectIdx) => () => {
      if (!isActive) {
        dispatch(makeDraftActive({ projectIdx }))
      }
    },
    []
  )
  const onProjectDeleteClick = useCallback(projectIdx => () => dispatch(deleteDraft({ projectIdx })), [])
  const onCreateNewDraftClick = useCallback(() => {
    const trackId = shortid.generate()
    dispatch(createDraft({ trackId, name: trackId }))
  }, [])
  const onPlayPauseClick = useCallback(() => {
    if (isPlaying) {
      dispatch(pauseDraft())
    } else {
      dispatch(playDraft())
    }
  }, [])

  const onSaveAsWavClick = useCallback(() => {
    audio.renderToWav(`${activeDraft.title || 'monochord-demo'}-${moment().format('YYYY-M-D-H-m-s')}.wav`)
  }, [])

  return (
    <div className="Editor">
      <Unless condition={isNil(hash)}>{` - ${hash}`}</Unless>
      <Unless condition={isNil(revision)}>{` - ${revision}`}</Unless>
      <hr />
      Drafts
      <ul>
        {projects.map(({ title, isActive }, projectIdx) => (
          <li key={projectIdx}>
            <Checkbox
              label={title || <i>Untitled project</i>}
              checked={isActive}
              onChange={onActiveProjectToggle(isActive, projectIdx)}
            />
            <Button label="delete" onClick={onProjectDeleteClick(projectIdx)} />
          </li>
        ))}
      </ul>
      <Button label="create new draft" onClick={onCreateNewDraftClick} />
      <hr />
      <Button disabled={!isAudioEnabled} label={isPlaying ? 'pause' : 'play'} onClick={onPlayPauseClick} />
      <Button disabled={!isAudioEnabled} label="save as wav" onClick={onSaveAsWavClick} />
      <Unless condition={isNil(activeDraft)}>
        {() => (
          <>
            <hr />
            <Project {...activeDraft} />
          </>
        )}
      </Unless>
    </div>
  )
}

export default Editor
