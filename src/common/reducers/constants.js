import autodux from 'autodux'

const { reducer, actions } = autodux({
  slice: 'constants',
  initial: {},
  actions: {}
})

export { reducer, actions }
