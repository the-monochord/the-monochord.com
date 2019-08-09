import React, { Fragment } from 'react'
import Button from '../../../Button'
import DebounceOnChange from '../../../DebounceOnChange'
import TextField from '../../../TextField'
import VolumeControl from '../../../VolumeControl'
import Bar from './Bar'

const DebouncedTextField = DebounceOnChange(300, TextField)
const DebouncedVolumeControl = DebounceOnChange(100, VolumeControl)

const Track = props => {
  const { bars = [], name, id, volume, setTrackProperty, addBar, removeBar, projectIdx, cursorAt } = props
  return (
    <div className={'Track'}>
      <DebouncedTextField
        placeholder="Unnamed track"
        value={name}
        onChange={value => {
          setTrackProperty({
            projectIdx,
            trackId: id,
            property: 'name',
            value
          })
        }}
      />
      <br />
      volume:{' '}
      <DebouncedVolumeControl
        value={volume}
        onChange={value => {
          setTrackProperty({
            projectIdx,
            trackId: id,
            property: 'volume',
            value
          })
        }}
      />
      {bars.map((bar, idx) => (
        <Fragment key={idx}>
          <div>{JSON.stringify(bar)}</div>
          <Bar {...bar} />
          <Button
            onClick={() => {
              console.log('edit bar: ', projectIdx, idx)
            }}
            label={'edit bar'}
          />
          <Button onClick={() => removeBar({ projectIdx, barIdx: idx })} label={'remove bar'} />
        </Fragment>
      ))}
      <br />
      <Button onClick={() => addBar({ projectIdx, trackId: id, startTime: cursorAt })} label={'add bar'} />
    </div>
  )
}

export default Track
