import path from 'path'
import { keys } from 'ramda'
import moment from 'moment'
import { getLocalIP, isLocal } from './helpers'

const mainDomain = 'the-monochord.com'
const staticDomain = `cdn.${mainDomain}`
const localDomain = getLocalIP()
const isRunningLocally = isLocal(mainDomain)

const mode = process.env.NODE_ENV || 'production'
const ipaddress = process.env.NODE_IP || '0.0.0.0'
const port = process.env.NODE_PORT || 3000
const staticPath = isRunningLocally ? `http://${localDomain}:3000` : `https://${staticDomain}`
const mainPath = isRunningLocally ? `http://${localDomain}:3000` : `https://${mainDomain}`
const languages = {
  en: 'English',
  hu: 'Magyar'
}
const themes = ['dark', 'light']
const displayModes = ['normal', 'frequency', 'cents', 'pitches']
const splashes = [
  'All pianos are out of tune',
  'Oh, the joy of hearing a justly tuned chord...',
  'Fretless instruments are awesome!',
  `It's not out of tune, but tuned differently`,
  'Can you sing a harmonic seventh chord?',
  'Let this app be a haven for your ears',
  `Once you dive in, there's no turning back!`,
  'A = 432Hz is baloney!',
  'Yes, there are also undertones',
  'All waveforms can be synthesized from sine waves!',
  'Supports both MIDI IN and MIDI OUT',
  'Music is just organized noise',
  'Now with HTTPS',
  'We miss you, Joakim!'
]

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
    mainWindow: 'dashboard'
  },
  themes,
  languages,
  path: {
    static: staticPath,
    main: mainPath
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
  secret: 'tüdőszűrés'
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
  directory: path.resolve(__dirname, '../../i18n'),
  updateFiles: false
}

export {
  mode,
  ipaddress,
  port,
  staticPath,
  mainPath,
  languages,
  splashes,
  defaultSessionData,
  settings,
  sessionConfig,
  minifyHTMLConfig,
  i18nConfig,
  themes,
  displayModes
}
