import {
  join,
  repeat,
  compose,
  reject,
  startsWith,
  head,
  toPairs,
  fromPairs,
  curry,
  split,
  toLower,
  modulo,
  __,
  when,
  either,
  complement,
  lt,
  always,
  gt,
  update,
  indexOf,
  concat,
  slice,
  remove,
  reduce
} from 'ramda'

const isFunction = fn => typeof fn === 'function'
const generatePrefix = curry((symbol, amount) => join('', repeat(symbol, amount)))

const angularToNormalJSON = compose(fromPairs, reject(compose(startsWith('$$'), head)), toPairs)

function safeApply(scope, callback = NOP) {
  const phase = scope.$root.$$phase
  if (phase !== '$apply' && phase !== '$digest') {
    scope.$apply(callback)
  } else {
    callback()
  }
}

const roundToNDecimals = curry(
  (decimals, number) => Math.round(number * 10 ** decimals) / 10 ** decimals
)
const roundTo2Decimals = roundToNDecimals(2)

const toDashCase = compose(toLower, join('-'), split(/(?=[A-Z])/))

const NOP = () => {}

function watchForHover(container) {
  let lastTouchTime = 0

  function enableHover() {
    if (new Date() - lastTouchTime >= 500 && !container.classList.contains('has-hover')) {
      container.classList.add('has-hover')
    }
  }

  function disableHover() {
    container.classList.remove('has-hover')
  }

  function updateLastTouchTime() {
    lastTouchTime = new Date()
  }

  document.addEventListener('touchstart', compose(disableHover, updateLastTouchTime), true)
  document.addEventListener('mousemove', enableHover, true)

  enableHover()
}

const minAll = xs => Math.min.apply(null, xs)
const maxAll = xs => Math.max.apply(null, xs)
const isOdd = modulo(__, 2)
const clampToPositiveInt = when(either(complement(Number.isInteger), lt(__, 1)), always(1))

const isOutsideOfHearingRange = either(lt(__, 16), gt(__, 20000))

// source: https://stackoverflow.com/a/18915585/1806628
const skipInitialWatchRun = fn => (newValue, oldValue) => {
  if (newValue !== oldValue) {
    fn(newValue, oldValue)
  }
}

const arrayReplace = curry((from, to, array) => {
  const idx = indexOf(from, array)
  if (idx === -1) {
    return array
  } else {
    return update(idx, to, array)
  }
})

const arrayPadRight = curry((length, value, array) => {
  if (array.length < length) {
    return concat(array, repeat(value, length - array.length))
  } else {
    return array
  }
})

const arraySizeClamp = curry((min, max, fillerValue, array) => {
  if (array.length > max) {
    return slice(0, max, array)
  }

  if (array.length < min) {
    return arrayPadRight(min, fillerValue, array)
  }

  return array
})

const arrayRemoveFirstMatch = curry((value, array) => {
  const idx = indexOf(value, array)
  if (idx === -1) {
    return array
  } else {
    return remove(idx, 1, array)
  }
})

const arrayRemoveExact = curry((values, array) => {
  return reduce(
    (acc, valueToRemove) => {
      return arrayRemoveFirstMatch(valueToRemove, acc)
    },
    array,
    values
  )
})

export {
  isFunction,
  generatePrefix,
  angularToNormalJSON,
  safeApply,
  roundToNDecimals,
  roundTo2Decimals,
  toDashCase,
  NOP,
  watchForHover,
  minAll,
  maxAll,
  isOdd,
  clampToPositiveInt,
  isOutsideOfHearingRange,
  skipInitialWatchRun,
  arrayReplace,
  arrayPadRight,
  arraySizeClamp,
  arrayRemoveFirstMatch,
  arrayRemoveExact
}
