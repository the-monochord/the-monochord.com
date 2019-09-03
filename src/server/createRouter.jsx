import React from 'react'
import express from 'express'
import { find, isNil, mergeDeepRight } from 'ramda'
import { I18nextProvider } from 'react-i18next'
import { matchPath, StaticRouter } from 'react-router-dom'
import { renderToString } from 'react-dom/server'
import moment from 'moment'
import { isFunction } from '../common/helpers/function'
import App from '../common/components/App'
import routes from '../common/config/routes'
import { generateAppData } from './sync/helpers'
import { mode } from './config'
import { getSessionData, getTempData } from './helpers'

const createRouter = (passport, i18n, logger) => {
  const router = express.Router()

  router.post('/cookie', (req, res, next) => {
    res.setHeader('Set-Cookie', req.body.cookie)
    res.end()
  })

  router.get(
    '/login/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/login',
      successRedirect: '/'
    })
  )

  router.get('/login/facebook', passport.authenticate('facebook'))

  router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  router.get('*', (req, res, next) => {
    if (req.url === '/reload/reload.js') {
      next()
      return
    }

    const sessionData = getSessionData(req)
    const tempData = getTempData(req)

    if (!isNil(tempData.savedUrl)) {
      let redirected = false
      if (tempData.savedUrl !== req.url) {
        res.redirect(tempData.savedUrl)
        redirected = true
      }
      tempData.savedUrl = null
      req.session._ = tempData
      if (redirected) {
        return
      }
    }

    if (req.isAuthenticated()) {
      if (!isNil(sessionData.accounts.facebook) && moment().isAfter(sessionData.accounts.facebook.validUntil)) {
        logger.warn(`user with ${req.user.id} needs to reauthenticate with facebook`)
        tempData.savedUrl = req.url
        req.session._ = tempData
        res.redirect('/login/facebook')
        return
      }
      // TODO: add the same for google here, if needed
    }

    const activeRoute = find(route => matchPath(req.url, route), routes)

    if (activeRoute) {
      if (
        isFunction(activeRoute.preCheck) &&
        activeRoute.preCheck(req, res, matchPath(req.url, activeRoute.path).params)
      ) {
        return // preCheck handled the request for us
      }

      const appData = mergeDeepRight(
        {
          seo: {
            title: '',
            status: '',
            description: 'DESCRIPTION',
            url: 'URL'
          }
        },
        generateAppData(req)
      )

      ;(async () => {
        if (i18n.language !== sessionData.settings.language) {
          await i18n.changeLanguage(sessionData.settings.language)
        }

        const markup = renderToString(
          <I18nextProvider i18n={i18n}>
            <StaticRouter location={req.url} context={appData}>
              <App />
            </StaticRouter>
          </I18nextProvider>
        )

        res.render('pages/index', {
          markup,
          mode,
          appData
        })
      })()
    } else {
      next()
    }
  })

  return router
}

export default createRouter
