import React from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../Button'
import { actions as settingsActions } from '../../../reducers/settings'
import { useNamespaceSelector, useDispatch } from '../../../helpers/react'

const { updateTheme, updateLanguage } = settingsActions

const Settings = props => {
  const { theme: currentTheme, language: currentLanguage } = useNamespaceSelector('settings', ['theme', 'language'])
  const { valuesOfSettings } = useNamespaceSelector('constants', ['valuesOfSettings'])

  const dispatch = useDispatch()

  const { t } = useTranslation(['Settings'])

  return (
    <div>
      <h2>{t('Settings')}</h2>
      <div>
        theme:
        {valuesOfSettings.theme.map(theme => (
          <Button
            key={theme}
            disabled={theme === currentTheme}
            onClick={() => dispatch(updateTheme({ theme }))}
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
              dispatch(
                updateLanguage({
                  language
                })
              )
            }
            label={`${language}${language === currentLanguage ? ' (active)' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Settings
