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
  converge
} from 'ramda'

import { mainPath } from '../server/config'
import { prefixIfNotEmpty } from './helpers/string'

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

const getSetsArg = find(test(/^\d+(\.\d+)*(:\d+(\.\d+)*)*(-\d+(\.\d+)*(:\d+(\.\d+)*)*)*$/))

const isStringSet = test(/^\d+(:\d+)*$/)
const isCentSet = test(/^\d+\.\d+(:\d+\.\d+)*$/)

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
  return ifElse(
    isStringSet,
    compose(
      assoc('id', setId),
      mergeDeepRight(setDefaults),
      objOf('strings'),
      map(string => {
        const id = ++lastElementId
        return parseString({ waveform, id }, string)
      }),
      split(':')
    ),
    when(
      isCentSet,
      compose(
        assoc('id', setId),
        mergeDeepRight(setDefaults),
        objOf('cents'),
        map(cent => {
          const id = ++lastElementId
          return parseCent({ waveform, id }, cent)
        }),
        split(':')
      )
    )
  )(set)
})

const splitSets = compose(
  unless(
    isNil,
    compose(
      filter(either(isStringSet, isCentSet)),
      split('-')
    )
  ),
  getSetsArg
)

const getSets = curry((waveform, args) =>
  compose(
    defaultTo([]),
    unless(isNil, addIndex(map)((set, idx) => parseSet({ waveform, setId: idx + 1 })(set))),
    splitSets
  )(args)
)

const getSanitizedSets = compose(
  unless(isNil, join('-')),
  splitSets
)

const isValidWaveform = includes(__, validWaveforms)
const isDefaultWaveform = equals(defaultWaveform)

const getWaveformArg = find(isValidWaveform)

const getWaveform = compose(
  defaultTo(defaultWaveform),
  getWaveformArg
)

const findSmallestMultiplier = compose(
  reduce(min, Infinity),
  pluck('multiplier')
)

const areAllTheSame = compose(
  equals(1),
  length,
  uniq
)

const muteDuplicateFundamentals = map(set => {
  const type = length(set.strings) ? 'strings' : 'cents'

  return evolve({
    [type]: ifElse(
      compose(
        areAllTheSame,
        pluck('multiplier')
      ),
      converge(concat, [
        compose(
          map(assoc('muted', true)),
          init
        ),
        compose(
          of,
          last
        )
      ]),
      map(when(propEq('multiplier', findSmallestMultiplier(set[type])), assoc('muted', true)))
    )
  })(set)
})

const grammaticallyJoinArrayValues = when(
  test(/-/),
  compose(
    values => `${join(', ', init(values))} and ${last(values)}`,
    split('-')
  )
)

const getLastElementId = () => lastElementId

// ---------------------

const getParametersFromArgs = args => {
  const waveform = getWaveform(args)
  const sets = muteDuplicateFundamentals(getSets(waveform, args))

  const sanitizedSets = getSanitizedSets(args)
  const sanitizedWaveform = defaultTo('', getWaveformArg(args))

  return {
    waveform,
    sets,
    sanitizedSets,
    sanitizedWaveform
  }
}

const generateListenTitle = sanitizedSets => {
  return `Listen to the sound of ${grammaticallyJoinArrayValues(sanitizedSets)} - The Monochord`
}

const generateListenUrl = (sanitizedSets, sanitizedWaveform) => {
  return `${mainPath}/listen/${sanitizedSets}${prefixIfNotEmpty('/', sanitizedWaveform)}`
}

const generateMainTitle = () => 'The Monochord'

const generateMainUrl = () => mainPath

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
  getParametersFromArgs,
  generateListenTitle,
  generateListenUrl,
  generateMainTitle,
  generateMainUrl
}
