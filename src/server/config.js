import path from 'path'
import { keys, unless, always, append } from 'ramda'
import moment from 'moment'
import dotenv from 'dotenv'
import { getLocalIP, isLocal } from './helpers'

dotenv.config()

const mode = process.env.NODE_ENV || 'production'

const mainDomain = 'the-monochord.com'
const staticDomain = `cdn.${mainDomain}`
const localDomain = getLocalIP() || 'localhost'

const isRunningLocally = isLocal(mainDomain)
const isRunningOnMac = process.platform === 'darwin'

const host = '0.0.0.0'
const hostSecure = host
const port = mode === 'development' ? 3000 : 80
const portSecure = mode === 'development' ? 3443 : 443
const staticPath = isRunningLocally
  ? `http://${localDomain}:${port}`
  : `http://${staticDomain}:${port}`
const staticPathSecure = isRunningLocally
  ? `http://${localDomain}:${port}`
  : `https://${staticDomain}:${portSecure}`
const mainPath = isRunningLocally ? `http://${localDomain}:${port}` : `http://${mainDomain}:${port}`
const mainPathSecure = isRunningLocally
  ? `http://${localDomain}:${port}`
  : `https://${mainDomain}:${portSecure}`

const languages = {
  en: 'English',
  hu: 'Magyar'
}
const themes = ['dark', 'light']
const displayModes = ['normal', 'frequency', 'cents', 'pitches', 'alphabetical', 'solfeggio']

const defaultSessionData = {
  theme: 'dark',
  language: 'en',
  displayMode: 'pitches'
}

const settings = {
  baseVolume: 30,
  baseFrequency: 262,
  waveform: 'sine',
  sets: [],
  name: '',
  retune: {
    default: 'off',
    defaultForNew: 'inherit'
  },
  playbackMode: 'normal', // AudioModel.MODES.NORMAL
  _: {
    lastElementId: 0,
    lastSetId: 0,
    isSettingsVisible: false,
    mainWindow: 'scale-designer'
  },
  themes,
  languages,
  path: {
    static: staticPathSecure,
    main: mainPathSecure
  },
  ...defaultSessionData
}

const sessionConfig = {
  cookie: {
    secure: false, // TODO: set this to true, when HTTPS is available
    maxAge: moment.duration(2, 'months').asMilliseconds()
  },
  name: 'monochord.sid',
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET
}

const minifyHTMLConfig = {
  override: mode === 'production',
  htmlMinifier: {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    minifyJS: true
  }
}

const i18nConfig = {
  locales: keys(languages),
  defaultLocale: 'en',
  directory: path.resolve(__dirname, '../../../i18n'),
  updateFiles: false
}

const terminateSignals = unless(always(isRunningOnMac), append('SIGUSR2'), [
  'SIGHUP',
  'SIGINT',
  'SIGQUIT',
  'SIGILL',
  'SIGTRAP',
  'SIGABRT',
  'SIGBUS',
  'SIGFPE',
  'SIGUSR1',
  'SIGSEGV',
  'SIGTERM'
])

export {
  mode,
  host,
  hostSecure,
  port,
  portSecure,
  mainPath,
  mainPathSecure,
  staticPath,
  staticPathSecure,
  languages,
  defaultSessionData,
  settings,
  sessionConfig,
  minifyHTMLConfig,
  i18nConfig,
  themes,
  displayModes,
  terminateSignals
}
