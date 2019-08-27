import React from 'react'
import { useTranslation } from 'react-i18next'

const Connect = props => {
  const { t } = useTranslation(['Connect'])
  return (
    <div>
      <a href="/connect/facebook">{t('Add facebook profile')}</a>
    </div>
  )
}

export default Connect
