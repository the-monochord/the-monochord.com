import fs from 'fs'
import path from 'path'
import { propOr, mergeDeepRight, pick, clone, has, is } from 'ramda'
import { parse as parseCookie, serialize as serializeCookie } from 'cookie'
import { sign as signCookie } from 'cookie-signature'
import { defaultSessionData, mainPathSecure, defaultTempData, sessionConfig } from './config'

const getSessionData = req =>
  pick(
    ['accounts', 'drafts', 'personal', 'settings'],
    mergeDeepRight(clone(defaultSessionData), propOr({}, 'data', req.isAuthenticated() ? req.user : req.session))
  )

const getTempData = req =>
  pick(['lastModified', 'savedUrl'], mergeDeepRight(clone(defaultTempData), propOr({}, '_', req.session)))

const redirectToHTTPS = (req, res, next) => {
  if (req.secure) {
    next()
  } else {
    res.redirect(mainPathSecure + req.url)
  }
}

const getHttpsOptions = async () => {
  const key = await fs.promises.readFile(path.resolve(__dirname, '../../security/localhost.key'))
  const cert = await fs.promises.readFile(path.resolve(__dirname, '../../security/localhost.crt'))
  const ca = await fs.promises.readFile(path.resolve(__dirname, '../../security/rootCA.crt'))

  return {
    key,
    cert,
    ca,
    requestCert: false,
    rejectUnauthorized: true
  }
}

const hasSessionCookie = req => {
  return is(String, req.headers.cookie) && has(sessionConfig.name, parseCookie(req.headers.cookie))
}

const generateSessionCookie = req => {
  const { name, secret } = sessionConfig
  return serializeCookie(name, `s:${signCookie(req.sessionID, secret)}`, req.session.cookie.data)
}

export { getSessionData, getTempData, redirectToHTTPS, getHttpsOptions, hasSessionCookie, generateSessionCookie }
