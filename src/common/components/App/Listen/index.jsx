import React from 'react'
import { useTranslation } from 'react-i18next'

const Listen = props => {
  const { t } = useTranslation(['Listen'])
  return <div>{t('Listen')}</div>
}

export default Listen
