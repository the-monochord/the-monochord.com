import { includes, unless, append, always, clone } from 'ramda'
import moment from 'moment'
import dotenv from 'dotenv'
import { emptyProject } from '../common/config/defaults'

dotenv.config()

const isLocal = includes('--local', process.argv)
const isRunningOnMac = process.platform === 'darwin'

const mode = process.env.NODE_ENV || 'production'

const port = mode === 'development' ? 3000 : 80
const host = '0.0.0.0'
const portSecure = mode === 'development' ? 3443 : 443
const hostSecure = host
const staticPath = isLocal ? `http://cdn.localhost:${port}` : 'http://cdn.the-monochord.com'
const staticPathSecure = isLocal ? `https://cdn.localhost:${portSecure}` : 'https://cdn.the-monochord.com'
const mainPath = isLocal ? `http://localhost:${port}` : 'http://the-monochord.com'
const mainPathSecure = isLocal ? `https://localhost:${portSecure}` : 'https://the-monochord.com'

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

const sessionConfig = {
  cookie: {
    secure: false,
    maxAge: moment.duration(2, 'months').asMilliseconds()
  },
  name: 'monochord.sid',
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET
}

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
}

const facebookConfig = {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${mainPathSecure}/login/facebook/callback`,
  passReqToCallback: true,
  profileFields: ['id', 'displayName', 'picture.type(large)']
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}

const defaultSessionData = {
  drafts: {
    projects: [clone(emptyProject)]
  },
  settings: {
    language: 'en',
    theme: 'light'
  }
}

const defaultTempData = {
  lastModified: 0,
  savedUrl: null
}

export {
  isLocal,
  isRunningOnMac,
  mode,
  port,
  host,
  portSecure,
  hostSecure,
  staticPath,
  staticPathSecure,
  mainPath,
  mainPathSecure,
  terminateSignals,
  minifyHTMLConfig,
  sessionConfig,
  awsConfig,
  facebookConfig,
  dbConfig,
  defaultSessionData,
  defaultTempData
}
