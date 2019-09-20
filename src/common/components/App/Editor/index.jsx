import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import useRouter from 'use-react-router'
import { isNil, find, propEq, mergeDeepRight, defaultTo, compose, path } from 'ramda'
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
  const { t } = useTranslation(['Editor'])
  const {
    match: {
      params: { hash, revision }
    }
  } = useRouter()
  const { isPlaying, isAudioEnabled } = useNamespaceSelector('state', ['isPlaying', 'isAudioEnabled'])
  const { projects } = useNamespaceSelector('drafts', ['projects'])
  const activeDraft = useSelector(
    compose(
      mergeDeepRight({ tracks: [], bars: [], title: '', cursorAt: 0 }),
      defaultTo({}),
      find(propEq('isActive', true)),
      path(['drafts', 'projects'])
    )
  )
  const dispatch = useDispatch()

  const audio = useContext(AudioContext)

  return (
    <div className="Editor">
      {t('Editor')}
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
              onChange={() => {
                if (!isActive) {
                  dispatch(makeDraftActive({ projectIdx }))
                }
              }}
            />
            <Button onClick={() => dispatch(deleteDraft({ projectIdx }))} label="delete" />
          </li>
        ))}
      </ul>
      <Button
        onClick={() => {
          const trackId = shortid.generate()
          dispatch(createDraft({ trackId, name: trackId }))
        }}
        label="create new draft"
      />
      <hr />
      <Button
        disabled={!isAudioEnabled}
        label={isPlaying ? 'pause' : 'play'}
        onClick={() => {
          if (isPlaying) {
            dispatch(pauseDraft())
          } else {
            dispatch(playDraft())
          }
        }}
      />
      <Button
        disabled={!isAudioEnabled}
        label="save as wav"
        onClick={() => {
          audio.renderToWav(`${activeDraft.title || 'monochord-demo'}-${moment().format('YYYY-M-D-H-m-s')}.wav`)
        }}
      />
      <hr />
      <Project {...activeDraft} />
    </div>
  )
}

export default Editor
