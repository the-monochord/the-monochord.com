import React from 'react'
import { withTranslation } from 'react-i18next'
import { compose } from 'ramda'
import { withRouter } from 'react-router-dom'
import Button from '../Button'
import isomorphicConnect from '../../../helpers/isomorphicConnect'
import { actions as settingsActions } from '../../../reducers/settings'

const enhance = compose(
  withRouter,
  isomorphicConnect(
    state => ({
      ...state.settings,
      valuesOfSettings: state.constants.valuesOfSettings
    }),
    {
      ...settingsActions
    }
  ),
  withTranslation(['Settings'])
)

const Settings = props => {
  const { t, theme: currentTheme, language: currentLanguage, valuesOfSettings, updateTheme, updateLanguage } = props
  return (
    <div>
      <h2>{t('Settings')}</h2>
      <div>
        theme:
        {valuesOfSettings.theme.map(theme => (
          <Button
            key={theme}
            disabled={theme === currentTheme}
            onClick={() => updateTheme({ theme })}
            label={`${theme}${theme === currentTheme ? ' (active)' : ''}`}
          />
        ))}
      </div>
      <div>
        language:
        {valuesOfSettings.language.map(language => (
          <Button
            key={language}
            disabled={language === currentLanguage}
            onClick={() =>
              updateLanguage({
                language
              })
            }
            label={`${language}${language === currentLanguage ? ' (active)' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default enhance(Settings)
