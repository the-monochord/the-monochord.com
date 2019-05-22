import React from 'react'
import { withTranslation } from 'react-i18next'
import { compose } from 'ramda'

const enhance = compose(withTranslation(['Login']))

const Login = props => {
  const { t } = props
  return (
    <div>
      <a href="/login/facebook">{t('Login with facebook')}</a>
    </div>
  )
}

export default enhance(Login)
