import {
  memoizeWith,
  reduce,
  min,
  max,
  modulo,
  __,
  when,
  either,
  complement,
  lt,
  always,
  toString,
  curry,
  test,
  compose
} from 'ramda'

import { stringifyIfNeeded } from './string'

const roundToNDecimals = memoizeWith(
  toString,
  curry((decimals, number) => Math.round(number * 10 ** decimals) / 10 ** decimals)
)

const minAll = reduce(min, Infinity)

const maxAll = reduce(max, -Infinity)

const isOdd = modulo(__, 2)

const clampToPositiveInt = when(either(complement(Number.isInteger), lt(__, 1)), always(1))

// toFixed :: Number -> Number -> String
const toFixed = curry((decimals, number) => number.toFixed(decimals))

// hasFraction :: Number -> Boolean
const hasFraction = compose(
  test(/\.\d+$/),
  stringifyIfNeeded
)

export { roundToNDecimals, minAll, maxAll, isOdd, clampToPositiveInt, toFixed, hasFraction }
