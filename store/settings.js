export const state = () => {
  return {
    volume: 100,
    muted: false
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
  }
}
