import React from 'react'
import { withTranslation } from 'react-i18next'
import { compose } from 'ramda'

const enhance = compose(withTranslation(['ConvertRatioToCents']))

const ConvertRatioToCents = props => {
  const { t } = props
  return (
    <div>
      <h3>{t('Convert ratio to cents')}</h3>
    </div>
  )
}

export default enhance(ConvertRatioToCents)
