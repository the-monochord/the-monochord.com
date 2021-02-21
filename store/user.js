export const state = () => {
  return {
    isLoggedIn: false,
    uid: null,
    displayName: null,
    email: null,
    emailVerified: false,
    photoUrl: null
  }
}

export const mutations = {
  setUser(state, { uid, displayName, email, emailVerified, photoUrl }) {
    state.isLoggedIn = true
    if (typeof uid !== 'undefined') {
      state.uid = uid
    }
    if (typeof displayName !== 'undefined') {
      state.displayName = displayName
    }
    if (typeof email !== 'undefined') {
      state.email = email
    }
    if (typeof emailVerified !== 'undefined') {
      state.emailVerified = emailVerified
    }
    if (typeof photoUrl !== 'undefined') {
      state.photoUrl = photoUrl
    }
  },
  clearUser(state) {
    state.isLoggedIn = false
    state.uid = null
    state.displayName = null
    state.email = null
    state.emailVerified = false
    state.photoUrl = null
  }
}

export const actions = {
  onAuthStateChanged({ commit }, { authUser }) {
    if (!authUser) {
      commit('clearUser')
      return
    }
    const { uid, displayName, email, emailVerified, photoUrl } = authUser
    commit('setUser', {
      uid,
      displayName,
      email,
      emailVerified,
      photoUrl
    })
  },
  logout({ commit }) {
    commit('clearUser')
  }
}
