import fetch from 'node-fetch'
import { map, compose, forEach, toPairs } from 'ramda'
import { staticPathSecure } from './config'
import { logger } from './log'

const loadLanguages = (languages, agent, i18n) =>
  Promise.all(
    map(
      lang =>
        fetch(`${staticPathSecure}/i18n/${lang}.json`, { agent })
          .then(response => response.json())
          .then(
            compose(
              forEach(([ns, data]) => {
                i18n.addResources(lang, ns, data)
              }),
              toPairs
            )
          )
          .catch(e => {
            logger.error(`failed to load language file for ${lang}: ${e.message}`)
          }),
      languages
    )
  )

export default loadLanguages
