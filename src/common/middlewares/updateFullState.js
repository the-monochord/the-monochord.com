const fullStateUpdate = store => next => action => {
  if (action.type !== 'system/updateFullState') {
    return next(action)
  }

  // TODO: implement this
  console.log('need to update full state!', action)

  return next({ type: 'noop' })
}

export default fullStateUpdate
