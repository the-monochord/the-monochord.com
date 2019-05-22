import React from 'react'

const Bar = props => {
  const { notes = [] } = props
  return (
    <div className={'Bar'}>
      {notes.map((note, idx) => (
        <span key={idx}>{JSON.stringify(note)}</span>
      ))}
    </div>
  )
}

export default Bar
