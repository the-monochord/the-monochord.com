import autodux from 'autodux'
import { remove, append, clone, compose, map, evolve, F, adjust, T, assoc, reject, propEq, findIndex } from 'ramda'
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
      const { trackId, name } = payload
      return evolve({
        projects: compose(
          append(
            compose(
              evolve({
                bars: append({
                  trackId,
                  startTime: 0,
                  events: []
                }),
                tracks: append({
                  id: trackId,
                  name
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
      const { projectIdx, name, trackId, volume } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            tracks: append({
              id: trackId,
              name,
              volume
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
    setTrackProperty: (state, payload) => {
      const { projectIdx, trackId, property, value } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            tracks: tracks => {
              const trackIdx = findIndex(propEq('id', trackId), tracks)
              return adjust(trackIdx, assoc(property, value), tracks)
            }
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
      const { projectIdx, trackId, startTime } = payload
      return evolve({
        projects: adjust(
          projectIdx,
          evolve({
            bars: append({
              trackId,
              startTime,
              events: []
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
    }
  }
})

export { reducer, actions }
