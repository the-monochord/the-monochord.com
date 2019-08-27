import React from 'react'
import { useTranslation } from 'react-i18next'

const Login = props => {
  const { t } = useTranslation(['Login'])
  return (
    <div>
      <a href="/login/facebook">{t('Login with facebook')}</a>
    </div>
  )
}

export default Login
