import path from 'path'
import { curry, forEach } from 'ramda'
import bodyParser from 'body-parser'
import minifyHTML from 'express-minify-html'
import cors from 'cors'
import express from 'express'
import { minifyHTMLConfig, mode } from './config'
import { expressLogger } from './log'
import { redirectToHTTPS } from './helpers'

const expressBindRouter = curry((router, app) => {
  app.use('/', router)
  return app
})

const expressAppUse = curry((middlewares, app) => {
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(minifyHTML(minifyHTMLConfig))
  app.use(express.static('static-root'))
  app.use(expressLogger)
  app.use(cors())
  // TODO: the order DOES matter for middlwares, session needs to come before passport.session
  if (Array.isArray(middlewares)) {
    forEach(middleware => {
      app.use(middleware)
    }, middlewares)
  }
  app.use(redirectToHTTPS)

  if (mode === 'development') {
    const subdomain = require('express-subdomain')
    app.use(subdomain('cdn', express.static('static-cdn')))
  }

  return app
})

const expressAppConfig = app => {
  app.set('views', path.resolve(__dirname, '../../views'))
  app.set('view engine', 'ejs')

  if (mode === 'development') {
    // localhost has no TLD and by default subdomain offset is set to 2
    app.set('subdomain offset', 1)
  }

  return app
}

export { expressAppConfig, expressAppUse, expressBindRouter }
