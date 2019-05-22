import {
  unless,
  of,
  length,
  reduce,
  mergeDeepRight,
  compose,
  apply,
  concat,
  reverse,
  splitAt,
  useWith,
  negate,
  identity
} from 'ramda'

// wrapInArrayIfNeeded :: any -> Array<any>
const wrapInArrayIfNeeded = unless(Array.isArray, of)

// pickRandom :: Array<any> -> any
const pickRandomFromArray = values => values[Math.floor(Math.random() * length(values))]

const mergeDeepRightAll = ([first, ...rest]) => reduce(mergeDeepRight, first, rest)

// rotateLeft :: amount -> Array<any> -> Array<any>
const rotateLeft = compose(
  apply(concat),
  reverse,
  splitAt
)

// rotateRight :: amount -> Array<any> -> Array<any>
const rotateRight = compose(
  apply(concat),
  reverse,
  useWith(splitAt, [negate, identity])
)

export { wrapInArrayIfNeeded, pickRandomFromArray, mergeDeepRightAll, rotateLeft, rotateRight }
