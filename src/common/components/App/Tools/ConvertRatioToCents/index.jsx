import React from 'react'
import { useTranslation } from 'react-i18next'

const ConvertRatioToCents = props => {
  const { t } = useTranslation(['ConvertRatioToCents'])
  return (
    <div>
      <h3>{t('Convert ratio to cents')}</h3>
    </div>
  )
}

export default ConvertRatioToCents
