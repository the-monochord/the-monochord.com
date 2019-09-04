import React from 'react'
import { useTranslation } from 'react-i18next'

const ConvertCentsToRatio = props => {
  const { t } = useTranslation(['Tools'])
  return (
    <div>
      <h3>{t('Convert cents to ratio')}</h3>
    </div>
  )
}

export default ConvertCentsToRatio
