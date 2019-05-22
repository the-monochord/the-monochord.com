import React from 'react'
import { withTranslation } from 'react-i18next'
import { compose } from 'ramda'

const enhance = compose(withTranslation(['Connect']))

const Connect = props => {
  const { t } = props
  return (
    <div>
      <a href="/connect/facebook">{t('Add facebook profile')}</a>
    </div>
  )
}

export default enhance(Connect)
