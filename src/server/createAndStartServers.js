import http from 'http'
import https from 'https'
import { curry, pick } from 'ramda'
import { logger } from './log'
import { port, host, portSecure, hostSecure, mode } from './config'

const createAndStartServers = curry(async (httpsOptions, app) => {
  const serverHTTP = http.createServer(app)
  const serverHTTPS = https.createServer(httpsOptions, app)

  if (mode === 'development') {
    const reload = require('reload')
    try {
      await reload(app, {
        https: {
          certAndKey: pick(['key', 'cert'], httpsOptions)
        }
      })
      logger.info('reload.js started')
    } catch (e) {
      logger.error(`could not start reload.js: ${e.message}`)
    }
  }

  return Promise.all([
    new Promise((resolve, reject) => {
      serverHTTP.listen({ port, host }, e => {
        if (e) {
          reject(e)
        } else {
          logger.info(`HTTP server started @ http://${host}:${port}`)
          resolve(serverHTTP)
        }
      })
    }),
    new Promise((resolve, reject) => {
      serverHTTPS.listen({ port: portSecure, host: hostSecure }, e => {
        if (e) {
          reject(e)
        } else {
          logger.info(`HTTPS server started @ https://${hostSecure}:${portSecure}`)
          resolve(serverHTTPS)
        }
      })
    })
  ])
})

export default createAndStartServers
