import { evolve, append, reject, propEq, always, T, F } from 'ramda'
import uuidV4 from 'uuid/v4'
import autodux from 'autodux'

const { reducer, actions } = autodux({
  slice: 'state',
  initial: {},
  actions: {
    addNotification: (state, payload) => {
      const { title, detail, type } = payload
      const newData = {
        id: uuidV4(),
        title,
        detail,
        type
      }
      return evolve({
        notifications: append(newData)
      })(state)
    },
    removeNotification: (state, payload) => {
      const { id } = payload
      return evolve({
        notifications: reject(propEq('id', id))
      })(state)
    },
    updateModificationTime: (state, payload) => {
      const { currentUpdateTime } = payload
      return evolve({
        lastModified: always(currentUpdateTime)
      })(state)
    },
    turnOffline: (state, payload) => {
      return evolve({
        isOnline: F
      })(state)
    },
    turnOnline: (state, payload) => {
      return evolve({
        isOnline: T
      })(state)
    },
    playDraft: (state, payload) => {
      return evolve({
        isPlaying: T
      })(state)
    },
    pauseDraft: (state, payload) => {
      return evolve({
        isPlaying: F
      })(state)
    },
    stopDraft: (state, payload) => {
      return evolve({
        isPlaying: F
      })(state)
    },
    enableMidi: (state, payload) => {
      return evolve({
        isMidiEnabled: T
      })(state)
    },
    enableAudio: (state, payload) => {
      return evolve({
        isAudioEnabled: T
      })(state)
    },
    hotkeyPressed: (state, payload) => {
      return state
    }
  }
})

export { reducer, actions }
