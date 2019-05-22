import React from 'react'
import { withTranslation } from 'react-i18next'
import { compose } from 'ramda'
import { NavLink, withRouter } from 'react-router-dom'
import { When } from 'react-if'
import ConvertRatioToCents from './ConvertRatioToCents'

const enhance = compose(
  withRouter,
  withTranslation(['Tools'])
)

const Tools = props => {
  const {
    t,
    match: {
      params: { tool, input }
    }
  } = props
  return (
    <div>
      <h2>{t('Tools')}</h2>

      <NavLink to={'/tools/convert-ratio-to-cents'}>{t('Convert ratio to cents')}</NavLink>
      <br />
      <NavLink to={'/tools/convert-cents-to-ratio'}>{t('Convert cents to ratio')}</NavLink>
      <br />

      <When condition={tool === 'convert-ratio-to-cents'}>
        <ConvertRatioToCents input={input} />
      </When>
      <When condition={tool === 'convert-cents-to-ratio'}>
        <h3>{t('Convert cents to ratio')}</h3>
      </When>
    </div>
  )
}

export default enhance(Tools)
