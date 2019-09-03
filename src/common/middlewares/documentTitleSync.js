import { postfixIfNotEmpty } from '../helpers/string'

const documentTitleSync = store => next => action => {
  if (action.type === 'seo/setSeoData') {
    const { seo } = store.getState()
    const status = action.payload.status || seo.status
    const title = action.payload.title || seo.title
    const brand = seo.brand

    document.title = `${postfixIfNotEmpty(' ', status)}${postfixIfNotEmpty(' - ', title)}${brand}`
  }

  return next(action)
}

export default documentTitleSync
