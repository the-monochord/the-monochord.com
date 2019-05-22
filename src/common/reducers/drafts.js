import autodux from 'autodux'
import { remove, append, clone, compose, map, evolve, F, adjust, T, assoc, reject, propEq } from 'ramda'
import { emptyProject } from '../config/defaults'

const { reducer, actions } = autodux({
  slice: 'drafts',
  initial: {},
  actions: {
    deleteDraft: (state, payload) => {
      const { projectIdx } = payload
      return evolve({ projects: remove(projectIdx, 1) })(state)
    },
    createDraft: (state, payload) => {
      const { trackId, channels } = payload
      return evolve({
        projects: compose(
          append(
            compose(
              evolve({
                bars: append({
                  trackId,
                  notes: []
                }),
                tracks: append({
                  id: trackId,
                  channels
                })
              }),
              clone
            )(emptyProject)
          ),
          map(evolve({ isActive: F }))
        )
      })(state)
    },
    makeDraftActive: (state, payload) => {
      const { projectIdx } = payload
      return evolve({
        projects: compose(
          adjust(projectIdx, evolve({ isActive: T })),
          map(evolve({ isActive: F }))
        )
      })(state)
    },
    addTrack: (state, payload) => {
      const { projectIdx, channels, trackId } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            tracks: append({
              id: trackId,
              channels
            })
          })
        )
      })(state)
    },
    removeTrack: (state, payload) => {
      const { projectIdx, trackId } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            tracks: reject(propEq('id', trackId))
          })
        )
      })(state)
    },
    setTitle: (state, payload) => {
      const { projectIdx, title } = payload
      return evolve({
        projects: adjust(projectIdx, assoc('title', title))
      })(state)
    },
    addBar: (state, payload) => {
      const { projectIdx, trackId } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            bars: append({
              trackId,
              notes: []
            })
          })
        )
      })(state)
    },
    removeBar: (state, payload) => {
      const { projectIdx, barIdx } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            bars: remove(barIdx, 1)
          })
        )
      })(state)
    },
    moveBar: (state, payload) => {
      // TODO
      return state
    }
  }
})

export { reducer, actions }
