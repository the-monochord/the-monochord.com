import path from 'path'
import express from 'express'
import i18n from 'i18n'
import session from 'express-session'
import sessionFileStore from 'session-file-store'
import bodyParser from 'body-parser'
import cors from 'cors'

import { renderToString } from 'react-dom/server'
import React from 'react'

import minifyHTML from 'express-minify-html-2'

import {
  forEach,
  toPairs,
  mergeDeepRight,
  mergeDeepLeft,
  split,
  evolve,
  length,
  has,
  curry,
  propOr,
  compose,
  includes
} from 'ramda'
import App from '../common/components/App'

import {
  getParametersFromArgs,
  generateListenTitle,
  generateListenUrl,
  getLastElementId,
  generateMainTitle,
  unescape
} from '../common/listen'

import {
  mode,
  host,
  port,
  languages,
  staticPathSecure,
  mainPathSecure,
  defaultSessionData,
  settings,
  sessionConfig,
  minifyHTMLConfig,
  i18nConfig,
  themes,
  displayModes,
  terminateSignals
} from './config'

import { logger, expressLogger } from './log'

// import { getHttpsOptions } from './helpers'

// -----------

const getSessionData = req => propOr(defaultSessionData, 'data', req.session)

const getDefaultParams = req => {
  const session = getSessionData(req)
  return {
    mode,
    languages: toPairs(languages),
    language: session.language,
    title: generateMainTitle(),
    url: '',
    theme: session.theme,
    path: {
      static: staticPathSecure,
      main: mainPathSecure
    },
    seo: {
      brand: 'The Monochord',
      description: 'The Monochord is an app, which lets you experiment with microtonal scales'
    },
    __settings: {
      ...settings,
      ...session
    }
  }
}

const getListenParametersFromArgs = args => {
  const {
    waveform,
    sets,
    props,
    sanitizedSets,
    sanitizedWaveform,
    sanitizedProps
  } = getParametersFromArgs(args)

  const data = length(sets)
    ? {
        title: generateListenTitle(sanitizedSets),
        url: generateListenUrl(sanitizedSets, sanitizedWaveform, sanitizedProps),
        __settings: {
          // baseVolume: sanitizedWaveform === 'square' || sanitizedWaveform === 'sawtooth' ? 20 : 30,
          baseVolume: 30,
          retune: {
            default: 'lowestToBaseFreq'
          },
          waveform,
          sets,
          name: '',
          _: {
            lastElementId: getLastElementId(),
            lastSetId: length(sets),
            isSettingsVisible: true,
            mainWindow: 'scale-designer'
          }
        }
      }
    : {
        __settings: {
          baseVolume: 30
        }
      }

  // propsToImport
  if (props.name) {
    data.__settings.name = unescape(props.name)
  }
  if (props.labels) {
    const labels = (props.labels || '').split(',').map(label => unescape(label))
    data.__settings.sets.forEach((set, idx) => {
      set.label.alphabetical = labels[idx] || ''
    })
  }

  return data
}

const renderSEO = (req, config) => {
  const session = getSessionData(req)
  const newConfig = evolve({
    seo: mergeDeepLeft({
      url: config.url ? config.url : config.path.main,
      title: config.title
        ? i18n.__({ phrase: config.title, locale: session.language })
        : generateMainTitle(),
      description: i18n.__({ phrase: config.seo.description, locale: session.language }),
      image: `${config.path.static}/img/monochord-logo.png`
    })
  })(config)

  newConfig.__settings._.seo = newConfig.seo

  return newConfig
}

i18n.configure(i18nConfig)

const app = express()
const FileStore = sessionFileStore(session)

app.set('views', path.resolve(__dirname, '../../../views'))
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(minifyHTML(minifyHTMLConfig))
app.use(i18n.init)
app.use(cors())
app.use(express.static('static-root'))
if (mode === 'development') {
  app.use(express.static('static-cdn'))
}
app.use(
  session({
    ...sessionConfig,
    store: new FileStore({
      path: path.resolve(__dirname, '../../../sessions'),
      ttl: sessionConfig.cookie.maxAge / 1000
    })
  })
)
app.use(expressLogger)

app.get('/listen/*', (req, res) => {
  res.render(
    'pages/index',
    renderSEO(
      req,
      mergeDeepRight(getDefaultParams(req), getListenParametersFromArgs(split('/', req.params[0])))
    )
  )
})

app.get('/', (req, res) => {
  res.render('pages/index', renderSEO(req, getDefaultParams(req)))
})

app.get('/presetlist', (req, res) => {
  const {
    path: { static: staticPathSecure }
  } = getDefaultParams(req)
  res.json({
    'Bohlen-Pierce': `${staticPathSecure}/resources/scala-scales/bohlen-p.scl`,
    'Carlos Alpha': `${staticPathSecure}/resources/scala-scales/carlos_alpha.scl`,
    'Carlos Beta': `${staticPathSecure}/resources/scala-scales/carlos_beta.scl`,
    'Carlos Gamma': `${staticPathSecure}/resources/scala-scales/carlos_gamma.scl`,
    '7 tone just intonation': `${staticPathSecure}/resources/scala-scales/ji_7.scl`,
    '11 tone just intonation': `${staticPathSecure}/resources/scala-scales/ji_11.scl`,
    '12 tone just intonation': `${staticPathSecure}/resources/scala-scales/ji_12.scl`,
    '13 tone just intonation': `${staticPathSecure}/resources/scala-scales/ji_13.scl`,
    '17 tone just intonation': `${staticPathSecure}/resources/scala-scales/ji_17.scl`,
    '19 tone just intonation': `${staticPathSecure}/resources/scala-scales/ji_19.scl`
  })
})

app.get('/thank-you', (req, res) => {
  res.render('pages/thank-you', {
    ...getDefaultParams(req),
    title: '',
    url: '',
    seo: {
      description: '',
      url: mainPathSecure,
      title: 'Thank you for your donation! - The Monochord',
      image: `${staticPathSecure}/img/monochord-logo.png`
    }
  })
})

app.get('/react-poc', (req, res) => {
  const settings = renderSEO(req, getDefaultParams(req))

  const markup = renderToString(<App data={settings.__settings} />)

  res.render('pages/react-poc', mergeDeepRight(settings, { markup }))
})

const updateSession = curry((key, validValues, req) => {
  if (has(key, req.body) && includes(req.body[key], validValues)) {
    if (has('data', req.session)) {
      if (req.body[key] !== req.session.data[key]) {
        req.session.data[key] = req.body[key]
      }
    } else {
      if (req.body[key] !== defaultSessionData[key]) {
        req.session.data = { ...defaultSessionData, [key]: req.body[key] }
      }
    }
  }
  return req
})

app.post('/settings', (req, res) => {
  const sessionData = compose(
    getSessionData,
    updateSession('language', languages),
    updateSession('theme', themes),
    updateSession('displayMode', displayModes)
  )(req)

  res.json(sessionData)
})

// --------------

if (mode === 'development') {
  const http = require('http')
  const reload = require('reload')

  const server = http.createServer(app)
  reload(app)

  server.listen(port, host, () => {
    logger.info(`Server started @ ${host}:${port}`)
  })
} else {
  const greenlock = require('greenlock-express')

  greenlock
    .init({
      packageRoot: process.cwd(),
      configDir: './security/greenlock.d',
      maintainerEmail: 'm_lajos@hotmail.com',
      cluster: false
    })
    .serve(app)
}

// --------------

const onTerminateSignal = (terminateSignal = null) => () => {
  if (terminateSignal) {
    logger.info(`recieved ${terminateSignal}`)
    process.exit(0)
  }

  logger.info('server stopped')
}

;(async () => {
  // const httpsOptions = await getHttpsOptions()

  process.on('exit', onTerminateSignal())
  forEach(
    terminateSignal => process.on(terminateSignal, onTerminateSignal(terminateSignal)),
    terminateSignals
  )
})()
