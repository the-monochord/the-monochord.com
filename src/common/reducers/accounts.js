import autodux from 'autodux'

const { reducer, actions } = autodux({
  slice: 'accounts',
  initial: {},
  actions: {}
})

export { reducer, actions }
