import i18n from 'i18next'
import { loadLanguageFile } from '../helpers/i18n'

const languageLoader = store => next => action => {
  const {
    settings: { language: oldLanguage },
    constants: { staticPath }
  } = store.getState()
  const result = next(action)
  const {
    settings: { language: newLanguage }
  } = store.getState()

  if (oldLanguage !== newLanguage) {
    loadLanguageFile(newLanguage, staticPath, i18n).then(() => i18n.changeLanguage(newLanguage))
  }

  return result
}

export default languageLoader
