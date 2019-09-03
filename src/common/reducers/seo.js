import autodux from 'autodux'
import { mergeRight, pick } from 'ramda'

const { reducer, actions } = autodux({
  slice: 'seo',
  initial: {},
  actions: {
    setSeoData: (state, payload) => {
      return mergeRight(pick(['title', 'status'], payload), state)
    }
  }
})

export { reducer, actions }
