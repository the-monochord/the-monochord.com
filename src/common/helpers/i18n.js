/* global fetch */

import { clone, compose, includes, toPairs, forEach } from 'ramda'
import { i18nConfig } from '../config/i18n'

const loadedLanguages = []

const initI18n = i18n =>
  new Promise((resolve, reject) => {
    i18n.init(clone(i18nConfig), err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

const loadLanguageFile = (lang, staticPath, i18n) => {
  let tmp

  if (lang !== i18nConfig.fallbackLng && !includes(lang, loadedLanguages)) {
    loadedLanguages.push(lang)

    tmp = fetch(`${staticPath}/i18n/${lang}.json`)
      .then(response => response.json())
      .then(
        compose(
          () => {
            console.log(`done loading "${lang}" language files`)
          },
          forEach(([ns, data]) => {
            i18n.addResources(lang, ns, data)
          }),
          toPairs
        )
      )
      .catch(e => {
        console.error(`failed to load language file: ${lang}`, e)
      })
  } else {
    tmp = Promise.resolve()
  }

  return tmp
}

export { initI18n, loadLanguageFile }
