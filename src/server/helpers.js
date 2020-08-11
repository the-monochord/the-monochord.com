import path from 'path'
import fs from 'fs'
import { networkInterfaces } from 'os'
import {
  compose,
  values,
  flatten,
  find,
  both,
  propEq,
  prop,
  slice,
  includes,
  endsWith
} from 'ramda'
import { mainPathSecure } from './config'

const isLocal = mainDomain => {
  if (typeof window === 'undefined') {
    return compose(includes('--local'), slice(2, Infinity))(process.argv)
  } else {
    return !endsWith(mainDomain, window.location.hostname)
  }
}

const getLocalIP = () => {
  if (typeof window === 'undefined') {
    return compose(
      prop('address'),
      find(both(propEq('family', 'IPv4'), propEq('internal', false))),
      flatten,
      values
    )(networkInterfaces())
  } else {
    // we cheat by reading out the value from the DOM
    const canonicalHref = document.querySelector('link[rel="canonical"]').getAttribute('href')
    return canonicalHref.match(/(?:\d{1,3}\.){3}\d{1,3}/)[0]
  }
}

const redirectToHttps = (req, res, next) => {
  if (req.secure) {
    next()
  } else {
    res.redirect(mainPathSecure + req.url)
  }
}

const getHttpsOptions = async () => {
  const key = await fs.promises.readFile(path.resolve(__dirname, '../../../security/localhost.key'))
  const cert = await fs.promises.readFile(
    path.resolve(__dirname, '../../../security/localhost.crt')
  )
  const ca = await fs.promises.readFile(path.resolve(__dirname, '../../../security/rootCA.crt'))

  return {
    key,
    cert,
    ca,
    requestCert: false,
    rejectUnauthorized: true
  }
}

export { isLocal, getLocalIP, redirectToHttps, getHttpsOptions }
