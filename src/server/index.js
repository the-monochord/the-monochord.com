import https from 'https'
import express from 'express'
import { forEach, compose, without } from 'ramda'
import passport from 'passport'
import i18n from 'i18next'
import { i18nConfig, languages } from '../common/config/i18n'
import { initI18n } from '../common/helpers/i18n'
import { logger } from './log'
import { getHttpsOptions } from './helpers'
import { portSecure, hostSecure, terminateSignals } from './config'
import { destroyDBPool, createDBPool } from './db/setup'

import createRouter from './createRouter'
import loadLanguages from './loadLanguages'
import setupPassport from './setupPassport'
import createWebSocketServer from './createWebSocketServer'
import createAndStartServers from './createAndStartServers'
import initSession from './initSession'
import { expressAppConfig, expressAppUse, expressBindRouter } from './express'

const onTerminateSignal = (terminateSignal = null) => () => {
  if (terminateSignal) {
    logger.info(`recieved ${terminateSignal}`)
    process.exit(0)
  }

  destroyDBPool()
    .then(() => {
      logger.info('server stopped')
    })
    .catch(e => {
      logger.error(`failed to shut down db pool on server stop: ${e.message}`)
    })
}

;(async () => {
  createDBPool()

  const httpsOptions = await getHttpsOptions()

  // https://github.com/bitinn/node-fetch/issues/19#issuecomment-289709519
  const agent = new https.Agent(httpsOptions)

  setupPassport()
  logger.info(`passport initialized`)

  const session = initSession()
  const passportIniter = passport.initialize()
  const passportSession = passport.session()

  const sessionMiddlewares = [session, passportIniter, passportSession]

  const servers = await compose(
    createAndStartServers(httpsOptions),
    expressBindRouter(createRouter(passport, i18n, logger)),
    expressAppUse(sessionMiddlewares),
    expressAppConfig
  )(express())

  createWebSocketServer(servers[1], sessionMiddlewares)
  logger.info(`WSS server started @ wss://${hostSecure}:${portSecure}`)

  await initI18n(i18n)
  logger.info('i18n ready')

  await loadLanguages(without([i18nConfig.fallbackLng], languages), agent, i18n)
  logger.info(`finished loading language files`)

  process.on('exit', onTerminateSignal())
  forEach(terminateSignal => process.on(terminateSignal, onTerminateSignal(terminateSignal)), terminateSignals)
})()
