/* global location */

import { matchPath } from 'react-router-dom'
import { find } from 'ramda'
import { postfixIfNotEmpty } from '../helpers/string'
import routes from '../config/routes'

const documentTitleSync = store => next => action => {
  if (
    action.type === 'seo/setStatus' ||
    action.type === 'feedback/languageChanged' ||
    action.type === 'feedback/locationChanged'
  ) {
    const { seo } = store.getState()
    const status = action.payload.status || seo.status

    const activeRoute = find(route => matchPath(location.pathname, route), routes)
    const activeRouteParams = matchPath(location.pathname, activeRoute.path).params

    const { title } = activeRoute.getSeoData(activeRouteParams)

    document.title = `${postfixIfNotEmpty(' ', status)}${postfixIfNotEmpty(' - ', title)}${seo.brand}`
  }

  return next(action)
}

export default documentTitleSync
