import React, { Fragment } from 'react'
import Button from '../../../Button'
import Bar from './Bar'

const Track = props => {
  const { bars = [], channels, id, addBar, removeBar, /* moveBar, */ projectIdx } = props
  return (
    <div className={'Track'}>
      track = {id}
      <br />
      channels: {channels}
      {bars.map((bar, idx) => (
        <Fragment key={idx}>
          <Bar {...bar} />
          <Button onClick={() => removeBar({ projectIdx, barIdx: idx })} label={'remove bar'} />
        </Fragment>
      ))}
      <br />
      <Button onClick={() => addBar({ projectIdx, trackId: id })} label={'add bar'} />
    </div>
  )
}

export default Track
