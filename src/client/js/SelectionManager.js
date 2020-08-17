import {
  without,
  concat,
  sort,
  subtract,
  flatten,
  uniq,
  includes,
  __,
  partition,
  compose,
  map,
  nth,
  isEmpty,
  range,
  length
} from 'ramda'
import { minAll, maxAll } from './helpers'

class SelectionManager {
  constructor() {
    this._ = {
      selectedIndices: []
    }
  }

  isEmpty() {
    return isEmpty(this._.selectedIndices)
  }

  clear() {
    this._.selectedIndices = []
  }

  map(fn) {
    this._.selectedIndices = map(fn, this._.selectedIndices)
  }

  isSelected(idx) {
    return includes(idx, this._.selectedIndices)
  }

  count() {
    return length(this._.selectedIndices)
  }

  isAllSelected(...indices) {
    const uniqIndices = uniq(flatten(indices))

    const [selected, unselected] = partition(this.isSelected.bind(this), uniqIndices)

    return {
      selected,
      unselected
    }
  }

  add(...indices) {
    this._.selectedIndices = compose(
      sort(subtract),
      uniq,
      concat(__, this._.selectedIndices),
      flatten
    )(indices)
  }

  addRange(idx) {
    if (!this.isSelected(idx)) {
      const minIdx = minAll(this._.selectedIndices)
      const maxIdx = maxAll(this._.selectedIndices)
      if (idx < minIdx) {
        this.add(range(idx, minIdx))
      } else {
        this.add(range(maxIdx + 1, idx + 1))
      }
    }
  }

  remove(...indices) {
    this._.selectedIndices = compose(without(__, this._.selectedIndices), uniq, flatten)(indices)
  }

  toggle(...indices) {
    const { selected, unselected } = this.isAllSelected(indices)

    this.remove(selected)
    this.add(unselected)
  }

  mapTo(array) {
    return map(nth(__, array), this._.selectedIndices)
  }
}

export default SelectionManager
