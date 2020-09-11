import { propOr, insert } from 'ramda'
import { isFunction } from 'ramda-adjunct'

class Sets {
  constructor(model, $scope) {
    this._ = {
      model,
      $scope
    }
  }

  // adds a set with given params
  // @param params : (optional) <object>
  //   muted : <bool> | false
  // @returns <object> : the created set
  add(params = {}) {
    const { model, $scope } = this._

    const data = {
      id: ++model._lastSetId,
      retune: $scope.retune.defaultForNew,
      strings: [],
      cents: [],
      muted: propOr(false, 'muted', params),
      label: {
        alphabetical: ''
      }
    }

    $scope.sets.push(data)

    return data
  }

  addAfter(target, params = {}) {
    const { model, $scope } = this._

    let index = -1
    if (Number.isInteger(target)) {
      this.findById(target, (set, _index) => {
        index = _index
      })
    } else {
      index = $scope.sets.indexOf(target)
    }

    const data = {
      id: ++model._lastSetId,
      retune: $scope.retune.defaultForNew,
      strings: [],
      cents: [],
      muted: propOr(false, 'muted', params),
      label: {
        alphabetical: ''
      }
    }

    if (index !== -1) {
      $scope.sets = insert(index + 1, data, $scope.sets)
    }

    return data
  }

  // removes a set, specified by target
  // @param target : <object> | <int>
  //   object should be a valid set from the $scope.sets
  //   int should be a valid id of a set from $scope.sets
  remove(target) {
    const { $scope } = this._

    let index = -1
    if (Number.isInteger(target)) {
      this.findById(target, (set, _index) => {
        index = _index
      })
    } else {
      index = $scope.sets.indexOf(target)
    }

    if (index !== -1) {
      $scope.sets.splice(index, 1)
    }
  }

  // finds a set by ID; if found, then calls callback
  // @param setId : <int>
  // @param callback : <function>(set, index, array)
  //   where set is the found set's data object
  //   index is the index of set in $scope.sets
  //   array is $scope.sets
  // @return the set, that has been found or null
  findById(setId, callback) {
    const { $scope } = this._

    let set = null

    $scope.sets.some((_set, index, array) => {
      if (_set.id === setId) {
        if (isFunction(callback)) {
          callback(_set, index, array)
        }
        set = _set
        return true
      }
    })

    return set
  }

  // find the set, that comes before the target in the list of sets
  // @param target : <object> | <int>
  //   object should be a valid set from the $scope.sets
  //   int should be a valid id of a set from $scope.sets
  // @param callback : <function>(set)
  //   where set is the found set's data object
  // @return the set, that has been found or null
  findPrevious(target, callback) {
    const { $scope } = this._

    const setId = Number.isInteger(target) ? target : target.id
    let prevSet = null

    const found = $scope.sets.some(set => {
      if (set.id === setId && prevSet !== null) {
        if (isFunction(callback)) {
          callback(prevSet)
        }
        return true
      } else {
        prevSet = set
      }
    })

    return found ? prevSet : null
  }

  // find the set, that comes after the target in the list of sets
  // @param target : <object> | <int>
  //   object should be a valid set from the $scope.sets
  //   int should be a valid id of a set from $scope.sets
  // @param callback : <function>(set)
  //   where set is the found set's data object
  // @return the set, that has been found or null
  findNext(target, callback) {
    const { $scope } = this._

    const setId = Number.isInteger(target) ? target : target.id
    let prevSet = null
    let set = null

    $scope.sets.some(_set => {
      if (prevSet !== null && prevSet.id === setId) {
        if (isFunction(callback)) {
          callback(_set)
        }
        set = _set
        return true
      } else {
        prevSet = _set
      }
    })

    return set
  }

  findByElement(element) {
    const { $scope } = this._

    return (
      $scope.sets.find(_set => _set.strings.includes(element) || _set.cents.includes(element)) ||
      null
    )
  }
}

export default Sets
