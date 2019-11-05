import React, { Fragment, useCallback } from 'react'
import Button from '../../../Button'
import DebounceOnChange from '../../../DebounceOnChange'
import TextField from '../../../TextField'
import VolumeControl from '../../../VolumeControl'
import { actions as draftActions } from '../../../../../reducers/drafts'
import { useDispatch } from '../../../../../helpers/react'
import Bar from './Bar'

const DebouncedTextField = DebounceOnChange(300, TextField)
const DebouncedVolumeControl = DebounceOnChange(100, VolumeControl)

const { setTrackProperty, addBar, removeBar } = draftActions

const Track = props => {
  const { bars = [], name, id, volume, projectIdx, cursorAt } = props
  const dispatch = useDispatch()

  const onNameChange = useCallback(
    value => {
      dispatch(
        setTrackProperty({
          projectIdx,
          trackId: id,
          property: 'name',
          value
        })
      )
    },
    [projectIdx, id]
  )
  const onVolumeChange = useCallback(
    value => {
      dispatch(
        setTrackProperty({
          projectIdx,
          trackId: id,
          property: 'volume',
          value
        })
      )
    },
    [projectIdx, id]
  )
  const onAddBarClick = useCallback(() => dispatch(addBar({ projectIdx, trackId: id, startTime: cursorAt })), [
    projectIdx,
    id
  ])
  const onRemoveBarClick = useCallback(barId => () => dispatch(removeBar({ projectIdx, barId })), [projectIdx])

  return (
    <div className="Track">
      <DebouncedTextField placeholder="Unnamed track" value={name} onChange={onNameChange} />
      <br />
      volume: <DebouncedVolumeControl value={volume} onChange={onVolumeChange} />
      {bars.map((bar, idx) => (
        <Fragment key={idx}>
          <Bar {...bar} projectIdx={projectIdx} />
          <Button label="remove bar" onClick={onRemoveBarClick(bar.id)} />
        </Fragment>
      ))}
      <br />
      <Button label="add bar" onClick={onAddBarClick} />
    </div>
  )
}

export default Track
