import React from 'react'
import cn from 'classnames'
import { NOP } from '../../../../helpers/function'
import Button from '../../Button'
import { TYPE as NOTIFICATION_TYPE } from '../'
import s from './style.scss'

const Notification = props => {
  const { id, type, title, detail, onRemove = NOP } = props
  return (
    <div
      className={cn(
        s.Notification,
        type === NOTIFICATION_TYPE.INFO && s.info,
        type === NOTIFICATION_TYPE.WARNING && s.warning,
        type === NOTIFICATION_TYPE.ERROR && s.error,
        type === NOTIFICATION_TYPE.SUCCESS && s.success
      )}
    >
      <h4>{title}</h4>
      <p>{detail}</p>
      <Button onClick={() => onRemove(id)} icon={<>&times;</>} />
    </div>
  )
}

export default Notification
