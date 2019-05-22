import autodux from 'autodux'
import { evolve, T, assocPath, F, ifElse, hasPath, map, when, propEq } from 'ramda'

const { reducer, actions } = autodux({
  slice: 'midi',
  initial: {},
  actions: {
    noteOn: (state, payload) => {
      const { noteIdx } = payload
      return ifElse(
        hasPath(['noteTable', noteIdx]),
        evolve({
          noteTable: {
            [noteIdx]: {
              pressed: T,
              sustained: () => state.sustainOn
            }
          }
        }),
        assocPath(['noteTable', noteIdx], { pressed: true, sustained: state.sustainOn })
      )(state)
    },
    noteOff: (state, payload) => {
      const { noteIdx } = payload
      return ifElse(
        hasPath(['noteTable', noteIdx]),
        evolve({
          noteTable: {
            [noteIdx]: {
              pressed: F
            }
          }
        }),
        assocPath(['noteTable', noteIdx], { pressed: false, sustained: false })
      )(state)
    },
    sustainOn: (state, payload) => {
      return evolve({
        sustainOn: T,
        noteTable: map(when(propEq('pressed', true), evolve({ sustained: T })))
      })(state)
    },
    sustainOff: (state, payload) => {
      return evolve({
        sustainOn: F,
        noteTable: map(evolve({ sustained: F }))
      })(state)
    }
  }
})

export { reducer, actions }
