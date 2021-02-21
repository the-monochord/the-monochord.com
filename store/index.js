export const actions = {
  nuxtServerInit({ dispatch }, { res }) {
    if (res && res.locals && res.locals.user) {
      const { allClaims: claims, idToken: token, ...authUser } = res.locals.user
      dispatch('user/onAuthStateChanged', { authUser })
    }
  }
}
