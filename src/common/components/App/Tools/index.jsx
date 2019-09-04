import React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Switch, Case } from 'react-if'
import useRouter from 'use-react-router'
import ConvertRatioToCents from './ConvertRatioToCents'
import ConvertCentsToRatio from './ConvertCentsToRatio'

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

      <Switch>
        <Case condition={tool === 'convert-ratio-to-cents'}>{() => <ConvertRatioToCents input={input} />}</Case>
        <Case condition={tool === 'convert-cents-to-ratio'}>{() => <ConvertCentsToRatio input={input} />}</Case>
      </Switch>
    </div>
  )
}

export default Tools
