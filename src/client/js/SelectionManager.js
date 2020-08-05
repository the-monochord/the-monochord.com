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
  isEmpty
} from 'ramda'

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

  isSelected(idx) {
    return includes(idx, this._.selectedIndices)
  }

  isAllSelected(...indices) {
    const uniqIndices = uniq(flatten(indices))

    const [selected, unselected] = partition(includes(__, this._.selectedIndices), uniqIndices)

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
