import React, { Fragment, useCallback } from 'react'
import { filter, propEq, findIndex } from 'ramda'
import { useTranslation } from 'react-i18next'
import shortid from 'shortid'
import { actions as draftActions } from '../../../../reducers/drafts'
import Button from '../../Button'
import TextField from '../../TextField'
import DebounceOnChange from '../../DebounceOnChange'
import { roundToNDecimals } from '../../../../helpers/number'
import { useSelector, useDispatch } from '../../../../helpers/react'
import Track from './Track'

const DebouncedTextField = DebounceOnChange(300, TextField)

const { setTitle, addTrack, removeTrack, setCursorPosition } = draftActions

const Project = props => {
  const { tracks, bars, title, cursorAt } = props
  const { t } = useTranslation(['Project'])
  const activeDraftIndex = useSelector(state => findIndex(propEq('isActive', true), state.drafts.projects))
  const dispatch = useDispatch()

  const onTitleChange = useCallback(value => {
    dispatch(
      setTitle({
        projectIdx: activeDraftIndex,
        title: value
      })
    )
  }, [])

  // TODO: add debounce
  const onCursorAtChange = useCallback(e => {
    if (!isNaN(parseFloat(e.target.value))) {
      dispatch(
        setCursorPosition({
          projectIdx: activeDraftIndex,
          cursorAt: roundToNDecimals(3, parseFloat(e.target.value))
        })
      )
    }
  }, [])

  const onRemoveTrackClick = useCallback(
    trackId => () => dispatch(removeTrack({ projectIdx: activeDraftIndex, trackId })),
    []
  )

  const onAddTrackClick = useCallback(() => {
    const trackId = shortid.generate()
    dispatch(addTrack({ projectIdx: activeDraftIndex, name: trackId, trackId, volume: 1 }))
  }, [])

  return (
    <div className="Project">
      <DebouncedTextField placeholder="Untitled project" value={title} onChange={onTitleChange} />
      <br />
      cursor at:
      <input type="number" min="0" value={cursorAt} onChange={onCursorAtChange} />
      <br />
      {tracks.map(track => (
        <Fragment key={track.id}>
          <Track
            {...track}
            bars={filter(propEq('trackId', track.id), bars)}
            projectIdx={activeDraftIndex}
            cursorAt={cursorAt}
          />
          <Button onClick={onRemoveTrackClick(track.id)} label={t('Remove track')} />
        </Fragment>
      ))}
      <br />
      <Button label={t('Add track')} onClick={onAddTrackClick} />
    </div>
  )
}

export default Project
