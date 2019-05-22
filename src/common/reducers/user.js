import autodux from 'autodux'

const { reducer, actions } = autodux({
  slice: 'user',
  initial: {},
  actions: {}
})

export { reducer, actions }
