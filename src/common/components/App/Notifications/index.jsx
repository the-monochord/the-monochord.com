import React from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['Notifications'])
  const { notifications } = useNamespaceSelector('state', ['notifications'])
  const dispatch = useDispatch()

  return (
    <div>
      <h2>{t('Notifications')}</h2>
      {notifications.map(props => (
        <Notification key={props.id} {...props} onRemove={id => dispatch(removeNotification({ id }))} />
      ))}
    </div>
  )
}

export default Notifications

export { TYPE }
