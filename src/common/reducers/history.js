import autodux from 'autodux'
import { evolve, empty, takeLast, compose, append, last, init, prepend, dissoc, head, tail, assoc, length } from 'ramda'

const { reducer, actions } = autodux({
  slice: 'history',
  initial: {},
  actions: {
    add: (state, payload) => {
      const { action, stateBefore, slice } = payload
      return evolve({
        nexts: empty,
        prevs: compose(
          append({ stateBefore, action, slice }),
          takeLast(state.limit)
        )
      })(state)
    },
    undo: (state, payload) => {
      const entry = compose(
        dissoc('stateBefore'),
        last
      )(state.prevs)

      return evolve({
        prevs: prevs => {
          if (length(prevs) === 1) {
            return []
          } else {
            return init(prevs)
          }
        },
        nexts: prepend(entry)
      })(state)
    },
    redo: (state, payload) => {
      const { stateBefore } = payload
      const entry = compose(
        assoc('stateBefore', stateBefore),
        head
      )(state.nexts)

      return evolve({
        prevs: append(entry),
        nexts: nexts => {
          if (length(nexts) === 1) {
            return []
          } else {
            return tail(nexts)
          }
        }
      })(state)
    }
  }
})

export { reducer, actions }
