import React, { Fragment } from 'react'
import Button from '../../../Button'
// import Bar from './Bar'

const Track = props => {
  const { bars = [], name, id, addBar, /* removeBar, moveBar, */ projectIdx } = props
  return (
    <div className={'Track'}>
      track = {name}
      <br />
      {bars.map((bar, idx) => (
        <Fragment key={idx}>
          <div>{JSON.stringify(bar)}</div>
          {/*
          <Bar {...bar} />
          <Button onClick={() => removeBar({ projectIdx, barIdx: idx })} label={'remove bar'} />
          */}
        </Fragment>
      ))}
      <br />
      <Button onClick={() => addBar({ projectIdx, trackId: id })} label={'add bar'} />
    </div>
  )
}

export default Track
