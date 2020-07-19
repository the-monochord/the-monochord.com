/* global fetch */

import {
  map,
  omit,
  compose,
  reject,
  propSatisfies,
  either,
  complement,
  isEmpty,
  clone,
  pluck,
  sort,
  subtract,
  propEq,
  evolve,
  find,
  propOr
} from 'ramda'

import Model from '../Model'

import { corrigateNumber } from '../helpers'

const retuneMethods = [
  { method: 'off', label: 'none' },
  { method: 'lowestToBaseFreq', label: 'lowest to base frequency' },
  { method: 'highestToBaseFreq', label: 'highest to base frequency' },
  { method: 'lowestToPrevHighest', label: `stack lowest to previous' highest` },
  { method: 'highestToPrevLowest', label: `stack highest to previous' lowest` }
]

const setTypes = [
  { type: 'strings', label: 'harmonics' },
  { type: 'cents', label: 'cents' }
]

const displayModes = [
  'normal',
  'frequency',
  'cents',
  'pitches'
  // 'tredeks', // http://www.tonalsoft.com/enc/t/tredek.aspx
  // 'tinas' // http://www.tonalsoft.com/enc/t/tina.aspx
]

class ModelUI {
  constructor($scope, model) {
    this._ = {
      $scope,
      model,
      ratios: []
    }

    $scope.ui.model = {
      newSetType: 'strings',
      selectedElement: null,
      selectedSet: null,
      prev: {
        baseVolume: $scope.baseVolume
      },
      bfRandomParams: {
        limit: {
          lower: 250,
          upper: 600
        }
      }
    }

    this.webAudioSupported = model.webAudioSupported
    this.getwaveforms = model.getwaveforms
    this.lowestCent = model._lowestCent
    this.highestCent = model._highestCent
    this.lowestHarmonic = model._lowestHarmonic
    this.highestHarmonic = model._highestHarmonic
    this.isAudioEnabled = model.isAudioEnabled
    this.enableAudio = model.enableAudio

    $scope.$watch('waveform', newValue => {
      $scope.sets.forEach(set => {
        set.strings.forEach(string => {
          string.wave = newValue
        })
        set.cents.forEach(cent => {
          cent.wave = newValue
        })
      })
    })

    this.fetchIntervals()
  }

  // ----------------------

  async fetchIntervals() {
    const {
      $scope: {
        path: { static: staticPathSecure }
      }
    } = this._
    const response = await fetch(`${staticPathSecure}/resources/intervals.json`)
    const contentType = response.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      const json = await response.json()
      this._.ratios = compose(
        map(
          compose(
            evolve({
              ratio: sort(subtract)
            }),
            omit(['mappings', 'edos', 'hewm', 'limits'])
          )
        ),
        reject(propSatisfies(either(complement(Array.isArray), isEmpty), 'names'))
      )(json)
    }
  }

  addSet() {
    const { $scope, model } = this._

    model[$scope.ui.model.newSetType].add(model.sets.add({ muted: false }), {
      wave: $scope.waveform
    })
  }

  canCopySet() {
    const { $scope } = this._

    return $scope.ui.model.selectedSet !== null
  }

  copySet() {
    const { $scope, model } = this._

    if (this.canCopySet()) {
      const set = $scope.ui.model.selectedSet
      const setId = model.sets.add({
        muted: set.muted,
        retune: set.retune
      })
      const type = model.harmonics.isStringSet(set) ? 'strings' : 'cents'
      set[type].forEach(element => {
        model[type].add(setId, {
          muted: element.muted,
          multiplier: element.multiplier,
          wave: element.wave
        })
      })
    }
  }

  canMoveDownSet() {
    const { $scope } = this._

    const set = $scope.ui.model.selectedSet
    const sets = $scope.sets
    return set !== null && sets.indexOf(set) < sets.length - 1
  }

  canMoveUpSet() {
    const { $scope } = this._

    const set = $scope.ui.model.selectedSet
    const sets = $scope.sets
    return set !== null && sets.indexOf(set) > 0
  }

  moveDownSet() {
    const { $scope, model } = this._

    if (this.canMoveDownSet()) {
      const set = $scope.ui.model.selectedSet
      const sets = $scope.sets
      const index = sets.indexOf(set)
      const tmp = sets[index + 1]
      sets[index + 1] = sets[index]
      sets[index] = tmp
      model.updateOrder()
    }
  }

  moveUpSet() {
    const { $scope, model } = this._

    if (this.canMoveUpSet()) {
      const set = $scope.ui.model.selectedSet
      const sets = $scope.sets
      const index = sets.indexOf(set)
      const tmp = sets[index - 1]
      sets[index - 1] = sets[index]
      sets[index] = tmp
      model.updateOrder()
    }
  }

  isStringSet(set) {
    const { model } = this._

    return model.harmonics.isStringSet(set)
  }

  addElement(set) {
    const { $scope, model } = this._

    model[model.harmonics.isStringSet(set) ? 'strings' : 'cents'].add(set.id, {
      wave: $scope.waveform
    })
  }

  toggleSelectedElement(element) {
    const { $scope } = this._

    $scope.ui.model.selectedElement = $scope.ui.model.selectedElement === element ? null : element
  }

  toggleSelectedSet(set) {
    const { $scope } = this._

    $scope.ui.model.selectedSet = $scope.ui.model.selectedSet === set ? null : set
  }

  clearSelection() {
    const { $scope } = this._

    if ($scope.ui.model.selectedElement !== null) {
      $scope.ui.model.selectedElement = null
    } else {
      $scope.ui.model.selectedSet = null
    }
  }

  toggleBaseVolume() {
    const { $scope } = this._

    const notMuted = $scope.baseVolume > 0
    if (notMuted) {
      $scope.ui.model.prev.baseVolume = $scope.baseVolume
    }
    $scope.baseVolume = notMuted ? 0 : $scope.ui.model.prev.baseVolume
  }

  /*
  toggleAttackVolume () {
    const {$scope} = this._

    const notMuted = $scope.attackVolume > 0
    if (notMuted) {
      $scope.ui.model.prev.attackVolume = $scope.attackVolume
    }
    $scope.attackVolume = notMuted ? 0 : $scope.ui.model.prev.attackVolume
  }
  toggleDecayVolume () {
    const {$scope} = this._

    const notMuted = $scope.decayVolume > 0
    if (notMuted) {
      $scope.ui.model.prev.decayVolume = $scope.decayVolume
    }
    $scope.decayVolume = notMuted ? 0 : $scope.ui.model.prev.decayVolume
  }
  toggleSustainVolume () {
    const {$scope} = this._

    const notMuted = $scope.sustainVolume > 0
    if (notMuted) {
      $scope.ui.model.prev.sustainVolume = $scope.sustainVolume
    }
    $scope.sustainVolume = notMuted ? 0 : $scope.ui.model.prev.sustainVolume
  }
  */

  canHalve(set) {
    const { model } = this._

    return model.harmonics.canHalve(set)
  }

  halve(set) {
    const { model } = this._

    return model.harmonics.halve(set)
  }

  canLower(set) {
    const { model } = this._

    return model.harmonics.canLower(set)
  }

  lower(set) {
    const { model } = this._

    model.harmonics.lower(set)
  }

  canRaise(set) {
    const { model } = this._

    return model.harmonics.canRaise(set)
  }

  raise(set) {
    const { model } = this._

    model.harmonics.raise(set)
  }

  canDouble(set) {
    const { model } = this._

    return model.harmonics.canDouble(set)
  }

  double(set) {
    const { model } = this._

    model.harmonics.double(set)
  }

  canNormalize(set) {
    const { model } = this._

    return model.harmonics.canBeNormalized(
      set,
      Model.TYPE[model.harmonics.isStringSet(set) ? 'STRING' : 'CENT']
    )
  }

  normalise(set) {
    const { model } = this._

    model.harmonics.normalise(set, Model.TYPE[model.harmonics.isStringSet(set) ? 'STRING' : 'CENT'])
  }

  deleteSet(set) {
    const { $scope, model } = this._

    if ($scope.ui.model.selectedSet !== null && set.id === $scope.ui.model.selectedSet.id) {
      $scope.ui.model.selectedSet = null
    }
    model.sets.remove(set)
  }

  canLowerElement(element, step = 1) {
    const { model } = this._

    const isStringSet = model.harmonics.isStringSet(model.sets.findByElement(element))
    return element.multiplier - step >= (isStringSet ? model._lowestHarmonic : model._lowestCent)
  }

  lowerElement(element) {
    if (this.canLowerElement(element)) {
      element.multiplier = corrigateNumber(element.multiplier - 1)
    }
  }

  canRaiseElement(element, step = 1) {
    const { model } = this._

    const isStringSet = model.harmonics.isStringSet(model.sets.findByElement(element))
    return element.multiplier + step <= (isStringSet ? model._highestHarmonic : model._highestCent)
  }

  raiseElement(element) {
    if (this.canRaiseElement(element)) {
      element.multiplier = corrigateNumber(element.multiplier + 1)
    }
  }

  removeElement(element) {
    const { model } = this._

    const isStringSet = model.harmonics.isStringSet(model.sets.findByElement(element))
    model[isStringSet ? 'strings' : 'cents'].remove(element)
  }

  decreaseBaseFrequency() {
    const { $scope } = this._

    if (this.canDecreaseBaseFrequency()) {
      $scope.baseFrequency--
    }
  }

  increaseBaseFrequency() {
    const { $scope } = this._

    if (this.canIncreaseBaseFrequency()) {
      $scope.baseFrequency++
    }
  }

  randomizeBaseFrequency() {
    const { $scope } = this._

    let a = $scope.ui.model.bfRandomParams.limit.lower
    let b = $scope.ui.model.bfRandomParams.limit.upper
    if (a > b) {
      const tmp = a
      a = b
      b = tmp
    }
    $scope.baseFrequency = Math.floor(Math.random() * (b - a)) + a
  }

  canDecreaseBaseFrequency() {
    const { $scope, model } = this._

    return $scope.baseFrequency > model._lowestBaseFrequency
  }

  canIncreaseBaseFrequency() {
    const { $scope, model } = this._

    return $scope.baseFrequency < model._highestBaseFrequency
  }

  getRetuneMethods() {
    return retuneMethods
  }

  getSetTypes() {
    return setTypes
  }

  getDisplayModes() {
    return displayModes
  }

  getIntervalName(set) {
    const { ratios } = this._

    const setCopy = clone(set)
    this.normalise(setCopy)

    const [smaller, bigger] = compose(
      // TODO: filter out muted sounds
      sort(subtract),
      pluck('multiplier')
    )(setCopy[this.isStringSet(setCopy) ? 'strings' : 'cents'])

    let ret = ''

    if (bigger !== undefined) {
      const names = propOr(
        [],
        'names',
        find(
          this.isStringSet(setCopy)
            ? propEq('ratio', [smaller, bigger])
            : propEq('cents', bigger - smaller),
          ratios
        )
      )

      ret = names.length
        ? `[ ${names.join(', ')} ]${
            this.canNormalize(set)
              ? ` ( ${
                  this.isStringSet(setCopy) ? `${bigger} : ${smaller}` : `${bigger - smaller}¢`
                } )`
              : ''
          }`
        : ''
    }

    return ret
  }
}

export default ModelUI
