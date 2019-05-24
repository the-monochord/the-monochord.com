import { curry, clone } from 'ramda'
import { getSessionData, getTempData } from '../helpers'
import { staticPathSecure, mainPathSecure, mode } from '../config'
import { valuesOfSettings } from '../../common/config/defaults'

// -----------------------
// demo data
// -----------------------

const guitarSequence = [
  { note: 'D5', dur: '16n', time: `0:0:0` },
  { note: 'G4', dur: '16n', time: `0:0:2` },
  { note: 'B4', dur: '8n', time: `0:0:6` },
  { note: 'F#4', dur: '16n', time: `0:0:12` },
  { note: 'B3', dur: '16n', time: `0:0:14` },
  { note: 'E4', dur: '16n', time: `0:0:18` },
  { note: 'A4', dur: '16n', time: `0:0:20` },
  { note: 'F#4', dur: '16n', time: `0:0:22` }
]

const bassSequence1 = [
  { note: 'A1', dur: '16n', time: `0:0:0` },
  { note: 'A2', dur: '16n', time: `0:0:4` },
  { note: 'A1', dur: '16n', time: `0:0:8` },
  { note: 'A2', dur: '16n', time: `0:0:10` },
  { note: 'C2', dur: '16n', time: `0:0:16` },
  { note: 'C3', dur: '16n', time: `0:0:22` },
  { note: 'C2', dur: '16n', time: `0:0:24` },
  { note: 'C3', dur: '16n', time: `0:0:28` },
  { note: 'E1', dur: '16n', time: `0:0:32` },
  { note: 'E2', dur: '16n', time: `0:0:34` },
  { note: 'E1', dur: '16n', time: `0:0:40` },
  { note: 'E2', dur: '16n', time: `0:0:44` }
]

const bassSequence2 = [
  { note: 'A1', dur: '16n', time: `0:0:0` },
  { note: 'A2', dur: '16n', time: `0:0:6` },
  { note: 'A1', dur: '16n', time: `0:0:8` },
  { note: 'A2', dur: '16n', time: `0:0:12` },
  { note: 'C2', dur: '16n', time: `0:0:16` },
  { note: 'C3', dur: '16n', time: `0:0:18` },
  { note: 'C2', dur: '16n', time: `0:0:24` },
  { note: 'C3', dur: '16n', time: `0:0:30` },
  { note: 'E1', dur: '16n', time: `0:0:32` },
  { note: 'E2', dur: '16n', time: `0:0:36` },
  { note: 'E1', dur: '16n', time: `0:0:40` },
  { note: 'E2', dur: '16n', time: `0:0:42` }
]

const demoDraft = {
  from: { hash: null, revision: 0 },
  isActive: true,
  cursorAt: 0,
  title: 'Electric Counterpoint 3',
  assets: {},
  tracks: [
    { id: '23TplPdS', name: 'guitar1' },
    { id: '46Juzcyx', name: 'guitar2' },
    { id: '2WEKaVNO', name: 'guitar3' },
    { id: 'dogPzIz8', name: 'guitar4' },
    { id: 'nYrnfYEv', name: 'bass1' },
    { id: 'a4vhAoFG', name: 'bass2' }
  ],
  bars: [
    {
      name: 'guitar1',
      trackId: '23TplPdS',
      instrument: 'guitar1',
      events: clone(guitarSequence),
      props: { loop: 2, loopEnd: '1m' },
      startTime: 0
    },
    {
      name: 'guitar2',
      trackId: '46Juzcyx',
      instrument: 'guitar2',
      events: clone(guitarSequence),
      props: { loop: 2, loopEnd: '1m' },
      startTime: [2, 12]
    },
    {
      name: 'guitar3',
      trackId: '2WEKaVNO',
      instrument: 'guitar3',
      events: clone(guitarSequence),
      props: { loop: 2, loopEnd: '1m' },
      startTime: [-3, 12]
    },
    {
      name: 'guitar4',
      trackId: 'dogPzIz8',
      instrument: 'guitar4',
      events: clone(guitarSequence),
      props: { loop: 2, loopEnd: '1m' },
      startTime: [5, 12]
    },
    {
      name: 'bass1',
      trackId: 'nYrnfYEv',
      instrument: 'bass1',
      events: clone(bassSequence1),
      props: { loop: 1, loopEnd: '2m' },
      startTime: 0
    },
    {
      name: 'bass2',
      trackId: 'a4vhAoFG',
      instrument: 'bass2',
      events: clone(bassSequence2),
      props: { loop: 1, loopEnd: '2m' },
      startTime: 0
    }
  ]
}

// -----------------------

const generateAppData = req => {
  const { drafts, personal, settings } = getSessionData(req)
  const { lastModified } = getTempData(req)
  return {
    drafts: {
      projects: [demoDraft, drafts.projects]
    },
    settings,
    user: {
      isLoggedIn: req.isAuthenticated(),
      id: req.isAuthenticated() ? req.user.id : null,
      displayName: req.isAuthenticated() ? personal.displayName : 'Anonymous User',
      picture: req.isAuthenticated() ? personal.picture : null
    },
    constants: {
      staticPath: staticPathSecure,
      mainPath: mainPathSecure,
      valuesOfSettings,
      mode
    },
    seo: {
      themeColor: '#33332b',
      brand: 'The Monochord'
    },
    state: {
      notifications: [],
      lastModified,
      isOnline: false,
      isPlaying: false,
      isAudioEnabled: false,
      isMidiEnabled: false
    },
    midi: {
      sustainOn: false,
      noteTable: {}
    },
    history: {
      limit: 3,
      prevs: [],
      nexts: []
    }
  }
}

const isUser = curry((clientA, clientB) => {
  if (clientA.req.isAuthenticated()) {
    return clientB.req.isAuthenticated() && clientA.req.user.id === clientB.req.user.id
  } else {
    return clientA.req.sessionID === clientB.req.sessionID
  }
})

const isSelf = curry((clientA, clientB) => {
  return clientA.id === clientB.id
})

const bindSessionToWebocketClient = curry((sessionMiddlewares, req) => {
  return new Promise(resolve => {
    sessionMiddlewares[0](req, {}, () => {
      sessionMiddlewares[1](req, {}, () => {
        sessionMiddlewares[2](req, {}, () => {
          resolve(req)
        })
      })
    })
  })
})

export { generateAppData, isUser, isSelf, bindSessionToWebocketClient }
