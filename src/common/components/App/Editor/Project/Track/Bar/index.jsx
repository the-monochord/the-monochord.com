import React from 'react'

const Bar = props => {
  const { startTime, events } = props
  return (
    <div className={'Bar'}>
      starts from: {startTime}
      <br />
      {events.map((event, eventIdx) => (
        <pre key={eventIdx}>{JSON.stringify(event, null, 2)}</pre>
      ))}
    </div>
  )
}

export default Bar
