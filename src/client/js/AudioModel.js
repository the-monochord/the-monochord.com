/* global AudioContext */

import {
  flatten,
  clone,
  curry,
  multiply,
  map,
  compose,
  divide,
  __,
  replace,
  reject,
  keys,
  sum,
  prop,
  values,
  head,
  last,
  identity,
  filter,
  forEach,
  toPairs,
  isEmpty,
  find,
  evolve,
  reduce,
  assoc,
  gt,
  when,
  propOr,
  range,
  inc,
  converge,
  concat,
  of,
  unapply,
  pluck,
  always,
  ifElse,
  omit,
  startsWith,
  has
} from 'ramda'
import { postfixIfNotEmpty } from '../../common/helpers'
import { generatePrefix, roundTo2Decimals, isOutsideOfHearingRange } from './helpers'

import Wave from './Wave'

import PolySynth from './synth/gate-controllers/PolySynth'
import Subtractive from './synth/timbres/subtractive'

const minusOctaves = 3
const plusOctaves = 3

const isConnectedTo = curry((setGainID, node) => node.connectTo === setGainID)
const getNonMutedStringGainIds = compose(
  keys,
  reject(gain => gain.gain <= 0),
  prop('elementGains')
)
const getProperOscillatorIds = compose(
  keys,
  reject(osc => osc.frequency <= 0),
  prop('oscillators')
)

const getMinusPrefixes = (id = '') =>
  compose(map(compose(postfixIfNotEmpty(id), generatePrefix('-'))), range(1), inc)(minusOctaves)

const getPlusPrefixes = (id = '') =>
  compose(map(compose(postfixIfNotEmpty(id), generatePrefix('+'))), range(1), inc)(plusOctaves)

const concatAll = unapply(reduce(concat, []))

const generatePrefixedIds = (id = '') =>
  converge(concatAll, [getMinusPrefixes, of, getPlusPrefixes])(id)

const getFirstGainIdInSet = (virtual, setId) =>
  compose(
    head,
    keys,
    filter(gain => gain.connectTo === setId && gain.gain > 0)
  )(virtual.elementGains)

const getOctaveRatio = (virtual, setOrder) => {
  const _first = prop(
    'frequency',
    find(oscillator => oscillator.connectTo === getFirstGainIdInSet(virtual, head(setOrder)))(
      values(virtual.oscillators)
    )
  )
  const _last = prop(
    'frequency',
    find(oscillator => oscillator.connectTo === getFirstGainIdInSet(virtual, last(setOrder)))(
      values(virtual.oscillators)
    )
  )
  return _last / _first
}

const AudioModel = function (staticPathSecure) {
  let ctx = null
  let wave = null

  let mode = AudioModel.MODES.NORMAL
  let dirty = false

  // this is an on-off switch for the sound of sets in MODES.NORMAL
  let gate = null

  const real = {
    oscillators: {},
    gains: {}
  }

  const virtual = {
    oscillators: {},
    elementGains: {},
    setGains: {},
    mainGain: 1
  }

  let setOrder = []
  let timbre = null
  let gateController = null

  // --------------

  function commit() {
    if (ctx !== null && mode === AudioModel.MODES.NORMAL && dirty) {
      applyDiff(diffReal(correctGains(summarizeVirtual(virtual))))
      dirty = false
    }
  }

  function summarizeVirtual(virtual) {
    const parsedVirtual = {
      oscillators: {},
      elementGains: {},
      setGains: {},
      mainGain: 0
    }

    if (virtual.mainGain > 0) {
      parsedVirtual.mainGain = virtual.mainGain

      const nonMutedStringGainIds = getNonMutedStringGainIds(virtual)
      const properOscillatorIds = getProperOscillatorIds(virtual)

      compose(
        forEach(gSetId =>
          compose(
            forEach(gStringId => {
              // if string oscillator is connected to current string gain, then record it and we're done
              const oStringId = find(
                id => isConnectedTo(gStringId, virtual.oscillators[id]),
                properOscillatorIds
              )

              if (oStringId !== undefined) {
                parsedVirtual.oscillators[oStringId] = clone(virtual.oscillators[oStringId])
                parsedVirtual.elementGains[gStringId] = clone(virtual.elementGains[gStringId])
                parsedVirtual.setGains[gSetId] = clone(virtual.setGains[gSetId])
              }
            }),
            filter(gStringId => isConnectedTo(gSetId, virtual.elementGains[gStringId]))
          )(nonMutedStringGainIds)
        ),
        keys,
        reject(gain => gain.gain <= 0)
      )(virtual.setGains)
    }

    return parsedVirtual
  }
  function correctGains(parsedVirtual) {
    let correctedVirtual = clone(parsedVirtual)

    const setGainLimit = 1
    const stringGainLimit = 1

    // correct set gains

    const totalSetGain = compose(sum, pluck('gain'), values)(correctedVirtual.setGains)

    if (totalSetGain > setGainLimit) {
      correctedVirtual.setGains = map(
        evolve({
          gain: multiply(setGainLimit / totalSetGain)
        })
      )(correctedVirtual.setGains)
    }

    // correct string gains per set to result in sum(string gains) = 1 per set

    const totalStringGains = reduce(
      (totalStringGains, stringGain) => {
        const setId = stringGain.connectTo
        // TODO: turn this into ifElse and possibly a oneliner
        return assoc(setId, propOr(0, setId, totalStringGains) + stringGain.gain, totalStringGains)
      },
      {},
      values(correctedVirtual.elementGains)
    )

    compose(
      forEach(([setId, totalStringGain]) => {
        correctedVirtual.elementGains = map(
          when(
            isConnectedTo(setId),
            evolve({
              gain: multiply(stringGainLimit / totalStringGain)
            })
          )
        )(correctedVirtual.elementGains)
      }),
      toPairs,
      filter(gt(__, stringGainLimit))
    )(totalStringGains)

    // apply set gains and main gain to string gains

    correctedVirtual.gains = {}

    keys(correctedVirtual.elementGains).forEach(stringId => {
      const setId = correctedVirtual.elementGains[stringId].connectTo

      delete correctedVirtual.oscillators[stringId].connectTo

      correctedVirtual.gains[stringId] = {
        gain:
          correctedVirtual.elementGains[stringId].gain *
          correctedVirtual.setGains[setId].gain *
          correctedVirtual.mainGain
      }
    })

    correctedVirtual = omit(['elementGains', 'setGains', 'mainGain'], correctedVirtual)

    // collapse gains and oscillators

    keys(correctedVirtual.oscillators).forEach((stringId, index, array) => {
      if (index > 0) {
        for (let i = 0; i < index; i++) {
          const iOscillator = correctedVirtual.oscillators[array[i]]
          const currentOscillator = correctedVirtual.oscillators[stringId]

          if (
            iOscillator &&
            iOscillator.frequency === currentOscillator.frequency &&
            iOscillator.wave === currentOscillator.wave
          ) {
            correctedVirtual.gains[array[i]].gain += correctedVirtual.gains[stringId].gain

            delete correctedVirtual.gains[stringId]
            delete correctedVirtual.oscillators[stringId]

            break
          }
        }
      }
    })

    return correctedVirtual
  }

  // ===============================

  function diffReal(parsedVirtual) {
    const diff = {
      added: {
        oscillators: {},
        gains: {}
      },
      changed: {
        oscillators: {},
        gains: {}
      },
      removed: {
        oscillators: {},
        gains: {}
      }
    }

    forEach(([id, oscillator]) => {
      diff[real.oscillators[id] ? 'changed' : 'added'].oscillators[id] = oscillator
    }, toPairs(parsedVirtual.oscillators))

    forEach(([id, gain]) => {
      diff[real.gains[id] ? 'changed' : 'added'].gains[id] = gain
    }, toPairs(parsedVirtual.gains))

    forEach(([id, oscillator]) => {
      if (!parsedVirtual.oscillators[id]) {
        diff.removed.oscillators[id] = oscillator
      }
    }, toPairs(real.oscillators))

    forEach(([id, gain]) => {
      if (!parsedVirtual.gains[id]) {
        diff.removed.gains[id] = gain
      }
    }, toPairs(real.gains))

    return diff
  }

  function applyDiff(diff) {
    forEach(([stringId, current]) => {
      const g = ctx.createGain()
      g.gain.setValueAtTime(current.gain, ctx.currentTime)
      g.connect(gate)

      real.gains[stringId] = g
    })(toPairs(diff.added.gains))

    forEach(([stringId, current]) => {
      const o = wave.createOscillator(current.wave, current.frequency)
      o.start(ctx.currentTime)
      o.connect(real.gains[stringId])

      real.oscillators[stringId] = o
    })(toPairs(diff.added.oscillators))

    forEach(([stringId, current]) => {
      if (real.gains[stringId]) {
        real.gains[stringId].gain.setValueAtTime(current.gain, ctx.currentTime)
      }
    })(toPairs(diff.changed.gains))

    forEach(([stringId, current]) => {
      if (real.oscillators[stringId]) {
        wave.updateOscillator(real.oscillators[stringId], current.wave, current.frequency)
      }
    })(toPairs(diff.changed.oscillators))

    forEach(stringId => {
      real.oscillators[stringId].stop(ctx.currentTime)
      real.oscillators[stringId].disconnect()
      delete real.oscillators[stringId]
    })(keys(diff.removed.oscillators))

    forEach(stringId => {
      real.gains[stringId].disconnect()
      delete real.gains[stringId]
    })(keys(diff.removed.gains))
  }

  // --------------

  return {
    getWave: () => wave,
    enableAudio: function () {
      ctx = new AudioContext()
      wave = new Wave(ctx, staticPathSecure)

      gate = ctx.createGain()
      gate.connect(ctx.destination)

      timbre = new Subtractive(ctx, wave)
      gateController = new PolySynth(timbre)

      if (mode === AudioModel.MODES.NORMAL) {
        gateController.disable()
        commit()
        gate.gain.value = 1
      } else if (mode === AudioModel.MODES.PIANO) {
        mode = AudioModel.MODES.NORMAL
        commit()
        mode = AudioModel.MODES.PIANO
        gate.gain.value = 0
        gateController.enable()
      }
    },
    setMainVolume: function (volume) {
      virtual.mainGain = volume
      dirty = true
      return this
    },
    setString: function (stringId, config) {
      if (virtual.oscillators[stringId]) {
        if (has('frequency', config)) {
          virtual.oscillators[stringId].frequency = config.frequency
        }
        if (has('wave', config)) {
          virtual.oscillators[stringId].wave = config.wave
        }
      }
      if (virtual.elementGains[stringId] && has('muted', config)) {
        virtual.elementGains[stringId].gain = config.muted ? 0 : 1
      }
      dirty = true
      return this
    },
    setCent: function (centId, config) {
      return this.setString(`c${centId}`, config)
    },
    setSet: function (setId, config) {
      if (virtual.setGains[setId] && has('muted', config)) {
        virtual.setGains[setId].gain = config.muted ? 0 : 1
      }
      dirty = true
      return this
    },

    addString: function (stringId, setId, config) {
      virtual.elementGains[stringId] = {
        gain: has('muted', config) && config.muted ? 0 : 1,
        connectTo: `${setId}`
      }
      virtual.oscillators[stringId] = {
        wave: has('wave', config) ? config.wave : wave.getTypes()[0],
        frequency: has('frequency', config) ? config.frequency : 0,
        connectTo: `${stringId}`
      }
      dirty = true
      return this
    },
    addCent: function (centId, setId, config) {
      return this.addString(`c${centId}`, setId, config)
    },
    addSet: function (setId, config) {
      virtual.setGains[setId] = {
        gain: has('muted', config) && config.muted ? 0 : 1
      }
      dirty = true
      return this
    },

    removeString: function (stringId) {
      delete virtual.oscillators[stringId]
      delete virtual.elementGains[stringId]
      dirty = true
      return this
    },
    removeCent: function (centId) {
      delete virtual.oscillators[`c${centId}`]
      delete virtual.elementGains[`c${centId}`]
      dirty = true
      return this
    },
    removeSet: function (setId) {
      delete virtual.setGains[setId]
      dirty = true
      return this
    },

    commit: function () {
      commit()
      return this
    },

    updateOrder: function (ids) {
      setOrder = ids
    },

    setMode: function (value) {
      if (value !== mode) {
        mode = value

        if (ctx !== null) {
          if (mode === AudioModel.MODES.NORMAL) {
            gateController.disable()
            commit()
            gate.gain.setValueAtTime(1, ctx.currentTime)
          } else if (mode === AudioModel.MODES.PIANO) {
            gate.gain.setValueAtTime(0, ctx.currentTime)
            gateController.enable()
          }
        }
      }
    },
    gateOn: function (rawId) {
      if (ctx !== null) {
        gateController.noteOn(this.getPianoKeyFrequencies(rawId))
      }
    },
    gateOff: function (rawId) {
      if (ctx !== null) {
        gateController.noteOff(this.getPianoKeyFrequencies(rawId))
      }
    },
    getGateIds: function () {
      return ifElse(
        isEmpty,
        always([]),
        compose(flatten, map(generatePrefixedIds), keys)
      )(virtual.setGains)
    },
    getPianoKeyFrequencies: rawId => {
      const prefix = replace(/c?\d+$/, '', rawId)
      const id = replace(prefix, '', rawId)

      let adjustOctave = identity

      if (prefix !== '') {
        const octaveRatio = getOctaveRatio(virtual, setOrder)
        const factor = Math.pow(octaveRatio, prefix.length)

        adjustOctave = (startsWith('+', prefix) ? multiply : divide)(__, factor)
      }

      return compose(
        reject(isOutsideOfHearingRange),
        map(([stringId]) =>
          compose(roundTo2Decimals, adjustOctave)(virtual.oscillators[stringId].frequency)
        ),
        filter(([stringId, gain]) => gain.connectTo === id && gain.gain > 0),
        toPairs
      )(virtual.elementGains)
    },
    getPianoKeyCents: rawId => {
      // TODO: implement this
      return ''
    },
    updateSynth: settings => {
      if (ctx !== null) {
        timbre.update({
          mainVolume: settings.baseVolume / 100,
          waveform: settings.waveform
        })
        gateController.update(settings.synth)
      }
    }
  }
}

AudioModel.supported = has('AudioContext', window)

AudioModel.MODES = {
  NORMAL: 'normal',
  PIANO: 'piano'
}

export default AudioModel
