import { has, propOr } from 'ramda'
import Model from '../Model'

class Elements {
  constructor(model, $scope, type) {
    this._ = {
      model,
      $scope,
      type
    }
  }

  // params : multiplier, muted, wave
  add(target, params = {}) {
    const { model, $scope, type } = this._

    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    let data = {}
    const property = type === Model.TYPE.STRING ? 'strings' : 'cents'
    if (set && has(property, set)) {
      data = {
        id: ++model._lastElementId,
        multiplier: has('multiplier', params)
          ? params.multiplier
          : type === Model.TYPE.STRING
          ? model._lowestHarmonic
          : model._lowestCent,
        muted: propOr(false, 'muted', params),
        wave: propOr($scope.waveform, 'wave', params)
      }
      set[property].push(data)
    }

    return data
  }

  // target: string object | stringId
  remove(target) {
    const { model, $scope, type } = this._

    let index = -1
    let set
    const property = type === Model.TYPE.STRING ? 'strings' : 'cents'

    if (Number.isInteger(target)) {
      this[property].findById(target, (string, _index, array, _set) => {
        set = _set
        index = _index
      })
    } else {
      $scope.sets.some(_set => {
        index = _set[property].indexOf(target)
        if (index !== -1) {
          set = _set
          return true
        }
      })
    }

    if (index !== -1) {
      if (set[property].length === 1) {
        model.sets.remove(set)
      } else {
        set[property].splice(index, 1)
      }
    }
  }

  findById(id, callback) {
    const { $scope, type } = this._

    const property = type === Model.TYPE.STRING ? 'strings' : 'cents'
    let element

    const found = $scope.sets.some(set => {
      return set[property].some((_element, index, array) => {
        if (_element.id === id) {
          if (callback) {
            callback(_element, index, array, set)
          }
          element = _element
          return true
        }
      })
    })

    return found ? element : null
  }
}

export default Elements
