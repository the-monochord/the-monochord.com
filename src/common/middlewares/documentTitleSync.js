import i18n from 'i18next'
import { postfixIfNotEmpty } from '../helpers/string'

const documentTitleSync = store => next => action => {
  if (action.type === 'seo/setSeoData' || action.type === 'settings/updateLanguage') {
    const { seo } = store.getState()
    const status = action.payload.status || seo.status
    const title = action.payload.title || seo.title
    const brand = seo.brand

    document.title = `${postfixIfNotEmpty(' ', status)}${postfixIfNotEmpty(' - ', i18n.t(title))}${brand}`
  }

  return next(action)
}

export default documentTitleSync
