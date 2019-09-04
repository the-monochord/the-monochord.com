import autodux from 'autodux'
import { assoc } from 'ramda'

const { reducer, actions } = autodux({
  slice: 'settings',
  initial: {},
  actions: {
    updateTheme: (state, payload) => {
      const { theme } = payload
      return assoc('theme', theme, state)
    },
    updateLanguage: (state, payload) => {
      const { language } = payload
      return assoc('language', language, state)
    }
  }
})

export { reducer, actions }
