import autodux from 'autodux'

const { reducer, actions } = autodux({
  slice: 'personal',
  initial: {},
  actions: {}
})

export { reducer, actions }
