import {
  pluck,
  map,
  __,
  evolve,
  subtract,
  divide,
  add,
  multiply,
  compose,
  either,
  prop,
  none,
  ifElse,
  length,
  always,
  curry
} from 'ramda'
import monochord from 'monochord-core'
import Model from '../Model'
import { minAll, maxAll, isOdd, clampToPositiveInt, roundToNDecimals } from '../helpers'

const {
  math: { findGreatestCommonDivisorArray }
} = monochord

const divideBy = curry((by, elements) =>
  map(
    evolve({
      multiplier: divide(__, by)
    })
  )(elements)
)

const multiplyBy = curry((by, elements) =>
  map(
    evolve({
      multiplier: multiply(__, by)
    })
  )(elements)
)

const decreaseBy = curry((by, elements) =>
  map(
    evolve({
      multiplier: subtract(__, by)
    })
  )(elements)
)

const increaseBy = curry((by, elements) =>
  map(
    evolve({
      multiplier: add(__, by)
    })
  )(elements)
)

class Harmonics {
  constructor(model) {
    this._ = {
      model
    }
  }

  findInSet(target, harmonic, run) {
    const { model } = this._

    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    let element
    if (set) {
      set.strings.some((string, index, array) => {
        if (string.multiplier === harmonic) {
          if (run) {
            run(string, Model.TYPE.STRING, index, array, set)
          } else {
            element = string
          }
          return true
        }
      }) ||
        set.cents.some((cent, index, array) => {
          if (cent.multiplier === harmonic) {
            if (run) {
              run(cent, Model.TYPE.CENT, index, array, set)
            } else {
              element = cent
            }
            return true
          }
        })
    }
    if (!run) {
      return element
    }
  }

  getMultipliers(target, type) {
    const { model } = this._
    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    const property = type === Model.TYPE.STRING ? 'strings' : 'cents'
    return set && set[property] ? pluck('multiplier', set[property]) : []
  }

  isStringSet(set) {
    return set.strings.length > 0
  }

  getLowest(target, type) {
    return ifElse(length, minAll, always(null))(this.getMultipliers(target, type))
  }

  canLower(target, by) {
    if (!target) {
      return false
    }
    const { model } = this._

    by = clampToPositiveInt(by)

    const lString = this.getLowest(target, Model.TYPE.STRING)
    const lCent = this.getLowest(target, Model.TYPE.CENT)

    const canLowerString = lString !== null && lString - by >= model._lowestHarmonic
    const canLowerCent = lCent !== null && lCent - by >= model._lowestCent

    return (
      (lString === null && canLowerCent) ||
      (canLowerString && lCent === null) ||
      (canLowerString && canLowerCent)
    )
  }

  canHalve(target) {
    if (!target) {
      return false
    }
    const { model } = this._

    const set = Number.isInteger(target) ? model.sets.findById(target) : target

    const canHalveString = none(
      compose(
        either(isOdd, x => x / 2 <= model._lowestHarmonic),
        prop('multiplier')
      )
    )(set.strings)
    const canHalveCent = !set.cents.some(cent => cent.multiplier / 2 < model._lowestCent)

    return (
      (!set.strings.length && canHalveCent) ||
      (canHalveString && !set.cents.length) ||
      (canHalveString && canHalveCent)
    )
  }

  lower(target, by) {
    const { model } = this._

    by = clampToPositiveInt(by)
    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    if (this.canLower(set, by)) {
      set.strings = decreaseBy(by, set.strings)
      set.cents = decreaseBy(by, set.cents)
    }
  }

  halve(target) {
    const { model } = this._

    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    if (this.canHalve(set)) {
      set.strings = divideBy(2, set.strings)
      set.cents = divideBy(2, set.cents)
    }
  }

  getHighest(target, type) {
    const multipliers = this.getMultipliers(target, type)
    return multipliers.length ? maxAll(multipliers) : null
  }

  canRaise(target, by) {
    if (!target) {
      return false
    }
    const { model } = this._

    by = clampToPositiveInt(by)

    const hString = this.getHighest(target, Model.TYPE.STRING)
    const hCent = this.getHighest(target, Model.TYPE.CENT)

    const canRaiseString = hString !== null && hString + by <= model._highestHarmonic
    const canRaiseCent = hCent !== null && hCent + by <= model._highestCent

    return (
      (hString === null && canRaiseCent) ||
      (canRaiseString && hCent === null) ||
      (canRaiseString && canRaiseCent)
    )
  }

  canDouble(target) {
    if (!target) {
      return false
    }
    const { model } = this._

    const hString = this.getHighest(target, Model.TYPE.STRING)
    const hCent = this.getHighest(target, Model.TYPE.CENT)

    const canDoubleString = hString !== null && hString * 2 <= model._highestHarmonic
    const canDoubleCent = hCent !== null && hCent * 2 <= model._highestCent

    return (
      (hString === null && canDoubleCent) ||
      (canDoubleString && hCent === null) ||
      (canDoubleString && canDoubleCent)
    )
  }

  raise(target, by) {
    const { model } = this._

    by = clampToPositiveInt(by)
    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    if (this.canRaise(set, by)) {
      set.strings = increaseBy(by, set.strings)
      set.cents = increaseBy(by, set.cents)
    }
  }

  double(target) {
    const { model } = this._

    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    if (this.canDouble(set)) {
      set.strings = multiplyBy(2, set.strings)
      set.cents = multiplyBy(2, set.cents)
    }
  }

  canBeNormalized(target, type) {
    const { model } = this._

    if (type === Model.TYPE.CENT) {
      return this.getLowest(target, type) > model._lowestCent
    } else {
      const multipliers = this.getMultipliers(target, type)
      return (
        multipliers.length > 1 &&
        parseInt(findGreatestCommonDivisorArray(multipliers).toString()) > 1
      )
    }
  }

  normalize(target, type) {
    const { model } = this._

    if (this.canBeNormalized(target, type)) {
      const set = Number.isInteger(target) ? model.sets.findById(target) : target
      if (set) {
        if (type === Model.TYPE.CENT) {
          const lowest = this.getLowest(set, type)
          set.cents = compose(map(roundToNDecimals(5)), decreaseBy(lowest))(set.cents)
        } else {
          const gcd = parseInt(
            findGreatestCommonDivisorArray(this.getMultipliers(set, type)).toString()
          )
          set.strings = divideBy(gcd, set.strings)
        }
      }
    }
  }
}

export default Harmonics
