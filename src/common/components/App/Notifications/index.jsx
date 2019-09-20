import React, { useCallback } from 'react'
import { useDispatch, useNamespaceSelector } from '../../../helpers/react'
import { actions as stateActions } from '../../../reducers/state'
import Notification from './Notification'

const TYPE = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
}

const { removeNotification } = stateActions

const Notifications = props => {
  const { notifications } = useNamespaceSelector('state', ['notifications'])
  const dispatch = useDispatch()
  const onNotificationRemoveClick = useCallback(id => () => dispatch(removeNotification({ id })))

  return (
    <div>
      {notifications.map(props => (
        <Notification key={props.id} {...props} onRemove={onNotificationRemoveClick} />
      ))}
    </div>
  )
}

export default Notifications

export { TYPE }
