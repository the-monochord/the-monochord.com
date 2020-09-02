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
  gt
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
  isOutsideOfHearingRange
}
