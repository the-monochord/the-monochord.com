import React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { When } from 'react-if'
import useRouter from 'use-react-router'
import ConvertRatioToCents from './ConvertRatioToCents'

const Tools = props => {
  const { t } = useTranslation(['Tools'])
  const {
    match: {
      params: { tool, input }
    }
  } = useRouter()

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

export default Tools
