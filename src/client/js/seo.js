/* global history */

import {
  map,
  toString,
  compose,
  prop,
  join,
  ifElse,
  length,
  when,
  unless,
  always,
  isEmpty,
  curry,
  reject,
  equals,
  append
} from 'ramda'

import {
  getParametersFromArgs,
  generateListenTitle,
  generateListenUrl,
  isValidWaveform,
  isDefaultWaveform,
  generateMainTitle,
  generateMainUrl
} from '../../common/listen'

import { prefix, postfix, prefixIfNotEmpty, hasFraction } from '../../common/helpers'

const setUrl = (url, addToHistory) => {
  if (addToHistory) {
    history.pushState({}, '', url)
  }
  document.querySelector('meta[property="og:url"]').setAttribute('content', url)
  document.querySelector('link[rel="canonical"]').setAttribute('href', url)
  // document.querySelector('.sharethis-inline-share-buttons').setAttribute('data-url', url)
}

const setTitle = title => {
  document.title = title
  document.querySelector('meta[property="og:title"]').setAttribute('content', title)
  // document.querySelector('.sharethis-inline-share-buttons').setAttribute('data-title', title)
}

const setDescription = description => {
  document.querySelector('meta[name="description"]').setAttribute('content', description)
  document.querySelector('meta[property="og:description"]').setAttribute('content', description)
  // document.querySelector('.sharethis-inline-share-buttons').setAttribute('data-description', description)
}

const setImage = image => {
  document.querySelector('meta[property="og:image"]').setAttribute('content', image)
  // document.querySelector('.sharethis-inline-share-buttons').setAttribute('data-image', image)
}

const getImage = () => {
  return document.querySelector('meta[property="og:image"]').getAttribute('content')
}

const setSEOData = ({ url, title, description, image }, addToHistory = true) => {
  if (url) {
    setUrl(url, addToHistory)
  }
  if (title) {
    setTitle(title)
  }
  if (description) {
    setDescription(description)
  }
  if (image) {
    setImage(image)
  }
}

const getSEOData = args => {
  if (isEmpty(args)) {
    return {
      url: generateMainUrl(),
      title: generateMainTitle(),
      description: null,
      image: getImage()
    }
  } else {
    const { sanitizedSets, sanitizedWaveform, sanitizedProps } = getParametersFromArgs(args)

    return {
      url: generateListenUrl(sanitizedSets, sanitizedWaveform, sanitizedProps),
      title: generateListenTitle(sanitizedSets),
      description: null,
      image: getImage()
    }
  }
}

const centSetToString = compose(
  join(':'),
  when(isEmpty, append('0.0')),
  unless(compose(equals(1), length), reject(equals('0.0'))),
  map(compose(ifElse(hasFraction, toString, postfix('.0')), parseFloat, prop('multiplier')))
)
const stringSetToString = compose(join(':'), map(compose(toString, parseInt, prop('multiplier'))))

const setsToString = compose(
  join('-'),
  map(set => {
    return compose(
      when(() => prop('muted', set), prefix('~')),
      ifElse(
        compose(length, prop('cents')),
        compose(centSetToString, prop('cents')),
        compose(stringSetToString, prop('strings'))
      )
    )(set)
  })
)

const waveformToString = compose(
  when(isDefaultWaveform, always('')),
  unless(isValidWaveform, always('sine'))
)

const generateUrlFromState = curry((waveform, sets) => {
  const setsString = setsToString(sets)
  const waveformString = waveformToString(waveform)

  return prefix(setsString, prefixIfNotEmpty('/', waveformString))
})

export {
  setUrl,
  setTitle,
  setDescription,
  setImage,
  getImage,
  setSEOData,
  getSEOData,
  generateUrlFromState
}
