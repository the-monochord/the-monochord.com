import React from 'react'
import { useTranslation } from 'react-i18next'
import { compose } from 'ramda'
import { withRouter } from 'react-router-dom'
import isomorphicConnect from '../../../helpers/isomorphicConnect'
import { actions as stateActions } from '../../../reducers/state'
import Notification from './Notification'

const TYPE = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
}

const enhance = compose(
  withRouter,
  isomorphicConnect(
    state => ({
      notifications: state.state.notifications
    }),
    {
      ...stateActions
    }
  )
)

const Notifications = props => {
  const { notifications, removeNotification } = props

  const { t } = useTranslation(['Notifications'])

  return (
    <div>
      <h2>{t('Notifications')}</h2>
      {notifications.map(props => (
        <Notification key={props.id} {...props} onRemove={id => removeNotification({ id })} />
      ))}
    </div>
  )
}

export default enhance(Notifications)

export { TYPE }
