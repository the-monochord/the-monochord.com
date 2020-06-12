import { networkInterfaces } from 'os'
import { compose, values, flatten, find, both, propEq, prop, slice, includes, endsWith } from 'ramda'

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
    return document
      .querySelector('link[rel="canonical"]')
      .getAttribute('href')
      .match(/(?:\d{1,3}\.){3}\d{1,3}/)[0]
  }
}

export { isLocal, getLocalIP }
