import {
  find,
  test,
  curry,
  compose,
  assoc,
  map,
  mergeDeepRight,
  objOf,
  split,
  unless,
  isNil,
  addIndex,
  filter,
  either,
  join,
  includes,
  __,
  defaultTo,
  reduce,
  min,
  pluck,
  evolve,
  when,
  propEq,
  length,
  init,
  last,
  equals,
  uniq,
  ifElse,
  concat,
  of,
  converge,
  prepend,
  startsWith,
  replace,
  fromPairs,
  toPairs
} from 'ramda'
import { replaceAll } from 'ramda-adjunct'

import { prefixIfNotEmpty } from './helpers'

// ---------------------

const validWaveforms = ['sine', 'triangle', 'sawtooth', 'square']
const defaultWaveform = 'sine'

const setDefaults = {
  retune: 'inherit',
  muted: false,
  strings: [],
  cents: []
}

let lastElementId = 0

// ---------------------

const getSetsArg = find(test(/^~?\d+(\.\d+)*(:\d+(\.\d+)*)*(-~?\d+(\.\d+)*(:\d+(\.\d+)*)*)*$/))

const isStringSet = test(/^~?\d+(:\d+)*$/)
const isCentSet = test(/^~?\d+\.\d+(:\d+\.\d+)*$/)

const parseString = curry(({ waveform, id }, string) => ({
  id,
  wave: waveform,
  muted: false,
  multiplier: parseFloat(string)
}))

const parseCent = curry(({ waveform, id }, cent) => ({
  id,
  wave: waveform,
  muted: false,
  multiplier: parseFloat(cent)
}))

const parseSet = curry(({ setId, waveform }, set) => {
  const isMuted = startsWith('~', set)

  return compose(
    assoc('id', setId),
    assoc('muted', isMuted),
    mergeDeepRight(setDefaults),
    ifElse(
      () => isStringSet(set),
      compose(
        objOf('strings'),
        map(string => {
          const id = ++lastElementId
          return parseString({ waveform, id }, string)
        })
      ),
      compose(
        objOf('cents'),
        map(cent => {
          const id = ++lastElementId
          return parseCent({ waveform, id }, cent)
        }),
        when(compose(equals(1), length), prepend('0.0'))
      )
    ),
    split(':'),
    replace(/^~/, '')
  )(set)
})

const splitSets = compose(
  unless(isNil, compose(filter(either(isStringSet, isCentSet)), split('-'))),
  getSetsArg
)

const getSets = curry((waveform, args) => {
  const sets = splitSets(args)

  return compose(
    defaultTo([]),
    unless(
      isNil,
      addIndex(map)((set, idx) => {
        const setData = parseSet({ waveform, setId: idx + 1 }, set)
        setData.label = {
          alphabetical: idx + 1
        }
        return setData
      })
    )
  )(sets)
})

const getSanitizedSets = compose(unless(isNil, join('-')), splitSets)

const isValidWaveform = includes(__, validWaveforms)
const isDefaultWaveform = equals(defaultWaveform)

const getWaveformArg = find(isValidWaveform)

const getWaveform = compose(defaultTo(defaultWaveform), getWaveformArg)

const findSmallestMultiplier = compose(reduce(min, Infinity), pluck('multiplier'))

const areAllTheSame = compose(equals(1), length, uniq)

const muteDuplicateFundamentals = map(set => {
  const type = length(set.strings) ? 'strings' : 'cents'

  return evolve({
    [type]: ifElse(
      compose(areAllTheSame, pluck('multiplier')),
      converge(concat, [compose(map(assoc('muted', true)), init), compose(of, last)]),
      map(when(propEq('multiplier', findSmallestMultiplier(set[type])), assoc('muted', true)))
    )
  })(set)
})

const grammaticallyJoinArrayValues = when(
  test(/-/),
  compose(values => `${join(', ', init(values))} and ${last(values)}`, split('-'))
)

const getLastElementId = () => lastElementId

// ---------------------

const argsToKVPairs = args => {
  return compose(
    fromPairs,
    map(split(':')),
    filter(test(/^[a-zA-Z]+:.+$/)),
    map(decodeURIComponent)
  )(args)
}

const kvPairsToArgs = kvPairs => {
  return compose(join('/'), map(join(':')), toPairs)(kvPairs)
}

const getParametersFromArgs = args => {
  const waveform = getWaveform(args)
  const props = argsToKVPairs(args)
  const sets = muteDuplicateFundamentals(getSets(waveform, args, props))

  const sanitizedSets = getSanitizedSets(args)
  const sanitizedWaveform = defaultTo('', getWaveformArg(args))
  const sanitizedProps = kvPairsToArgs(props)

  return {
    waveform,
    sets,
    props,
    sanitizedSets,
    sanitizedWaveform,
    sanitizedProps
  }
}

const generateListenTitle = sanitizedSets => {
  return `Listen to the sound of ${grammaticallyJoinArrayValues(sanitizedSets)} - The Monochord`
}

const generateListenUrl = (sanitizedSets, sanitizedWaveform, sanitizedProps) => {
  return `/listen/${sanitizedSets}${prefixIfNotEmpty('/', sanitizedWaveform)}${prefixIfNotEmpty(
    '/',
    sanitizedProps
  )}`
}

const generateMainTitle = () => 'The Monochord'

const generateMainUrl = () => '/'

const escape = str => {
  return compose(replaceAll('/', '[slash]'), replaceAll('#', '[hashtag]'))(str)
}

const unescape = str => {
  return compose(replaceAll('[slash]', '/'), replaceAll('[hashtag]', '#'))(str)
}

// ---------------------

export {
  getSetsArg,
  isStringSet,
  isCentSet,
  parseString,
  parseCent,
  parseSet,
  splitSets,
  getSets,
  getSanitizedSets,
  isValidWaveform,
  isDefaultWaveform,
  getWaveformArg,
  getWaveform,
  findSmallestMultiplier,
  muteDuplicateFundamentals,
  grammaticallyJoinArrayValues,
  getLastElementId,
  argsToKVPairs,
  kvPairsToArgs,
  getParametersFromArgs,
  generateListenTitle,
  generateListenUrl,
  generateMainTitle,
  generateMainUrl,
  escape,
  unescape
}
