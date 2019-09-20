import autodux from 'autodux'
import {
  remove,
  append,
  clone,
  compose,
  map,
  evolve,
  F,
  adjust,
  T,
  assoc,
  reject,
  propEq,
  findIndex,
  assocPath
} from 'ramda'
import { fromScientificNotation } from 'absolute-cent'
import shortid from 'shortid'
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
                  id: shortid.generate(),
                  events: [
                    {
                      event: 'note on',
                      pitch: fromScientificNotation('F4'),
                      time: 0,
                      velocity: 0.5
                    },
                    {
                      event: 'note off',
                      pitch: fromScientificNotation('F4'),
                      time: 2
                    }
                  ]
                }),
                tracks: append({
                  id: trackId,
                  name,
                  volume: 1
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
        projects: {
          [projectIdx]: {
            tracks: append({
              id: trackId,
              name,
              volume
            })
          }
        }
      })(state)
    },
    removeTrack: (state, payload) => {
      const { projectIdx, trackId } = payload
      return evolve({
        projects: {
          [projectIdx]: {
            bars: reject(propEq('trackId', trackId)),
            tracks: reject(propEq('id', trackId))
          }
        }
      })(state)
    },
    setTrackProperty: (state, payload) => {
      const { projectIdx, trackId, property, value } = payload
      return evolve({
        projects: {
          [projectIdx]: {
            tracks: tracks => {
              const trackIdx = findIndex(propEq('id', trackId), tracks)
              return adjust(trackIdx, assoc(property, value), tracks)
            }
          }
        }
      })(state)
    },
    setTitle: (state, payload) => {
      const { projectIdx, title } = payload
      return assocPath(['projects', projectIdx, 'title'], title, state)
    },
    addBar: (state, payload) => {
      const { projectIdx, trackId, startTime } = payload
      return evolve({
        projects: {
          [projectIdx]: {
            bars: append({
              id: shortid.generate(),
              trackId,
              startTime,
              events: []
            })
          }
        }
      })(state)
    },
    removeBar: (state, payload) => {
      const { projectIdx, barId } = payload
      return evolve({
        projects: {
          [projectIdx]: {
            bars: reject(propEq('id', barId))
          }
        }
      })(state)
    },
    setCursorPosition: (state, payload) => {
      const { projectIdx, cursorAt } = payload
      return assocPath(['projects', projectIdx, 'cursorAt'], cursorAt, state)
    },
    setBarProperty: (state, payload) => {
      const { projectIdx, barId, property, value } = payload
      const barIdx = findIndex(propEq('id', barId), state.projects[projectIdx].bars)
      return evolve({
        projects: {
          [projectIdx]: {
            bars: {
              [barIdx]: assoc(property, value)
            }
          }
        }
      })(state)
    }
  }
})

export { reducer, actions }
