import autodux from 'autodux'
import { assoc } from 'ramda'

const { reducer, actions } = autodux({
  slice: 'seo',
  initial: {},
  actions: {
    setStatus: (state, payload) => {
      const { status } = payload
      return assoc('status', status, state)
    }
  }
})

export { reducer, actions }
