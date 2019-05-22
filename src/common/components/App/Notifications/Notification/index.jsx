import React from 'react'
import { NOP } from '../../../../helpers/function'
import Button from '../../Button'

const Notification = props => {
  const { id, type, title, detail, onRemove = NOP } = props
  return (
    <div>
      type: {type}
      <br />
      title: {title}
      <br />
      detail: {detail}
      <Button onClick={() => onRemove(id)} icon={'x'} />
    </div>
  )
}

export default Notification
