export const state = () => {
  return {
    volume: 100,
    muted: false,
    darkMode: true
  }
}

export const mutations = {
  mute(state) {
    state.muted = true
  },
  unmute(state) {
    state.muted = false
  },
  setVolume(state, payload) {
    const { volume } = payload
    state.volume = volume
  },
  turnDarkModeOn(state) {
    state.darkMode = true
  },
  turnDarkModeOff(state) {
    state.darkMode = false
  }
}
