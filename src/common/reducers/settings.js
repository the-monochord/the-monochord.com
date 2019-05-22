import autodux from 'autodux'
import { evolve, always } from 'ramda'

const { reducer, actions } = autodux({
  slice: 'settings',
  initial: {},
  actions: {
    updateTheme: (state, payload) => {
      const { theme } = payload
      return evolve({
        theme: always(theme)
      })(state)
    },
    updateLanguage: (state, payload) => {
      const { language } = payload
      return evolve({
        language: always(language)
      })(state)
    }
  }
})

export { reducer, actions }
