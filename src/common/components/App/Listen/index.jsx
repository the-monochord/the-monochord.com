import React from 'react'
import { withTranslation } from 'react-i18next'
import { compose } from 'ramda'

const enhance = compose(withTranslation(['Listen']))

const Listen = props => {
  const { t } = props
  return <div>{t('Listen')}</div>
}

export default enhance(Listen)
