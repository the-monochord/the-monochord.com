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
  propOr,
  all,
  reverse,
  indexOf,
  __
} from 'ramda'

import Model from '../Model'

import { corrigateNumber } from '../helpers'
import SelectionManager from '../SelectionManager'
import EventBus from '../EventBus'

const retuneMethods = [
  { method: 'off', label: 'none' },
  { method: 'lowestToBaseFreq', label: 'lowest to base frequency' },
  { method: 'highestToBaseFreq', label: 'highest to base frequency' },
  { method: 'lowestToPrevHighest', label: `stack lowest to previous' highest` },
  { method: 'highestToPrevLowest', label: `stack highest to previous' lowest` }
]

const setTypes = [
  { type: Model.TYPE.STRING, label: 'harmonics' },
  { type: Model.TYPE.CENT, label: 'cents' }
]

const displayModes = [
  'normal',
  'frequency',
  'cents',
  'pitches',
  // 'tredeks', // http://www.tonalsoft.com/enc/t/tredek.aspx
  // 'tinas', // http://www.tonalsoft.com/enc/t/tina.aspx
  'alphabetical',
  'solfeggio'
]

class ModelUI {
  constructor($scope, model) {
    this._ = {
      $scope,
      model,
      ratios: [],
      selection: {
        pitches: new SelectionManager()
      }
    }

    $scope.ui.model = {
      newSetType: Model.TYPE.STRING,
      selectedElement: null,
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

    EventBus.on('scale imported', () => {
      this._.selection.pitches.clear()
    })

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

    const set = model.sets.add({ muted: false })

    if ($scope.ui.model.newSetType === Model.TYPE.CENT) {
      model.cents.add(set, {
        wave: $scope.waveform,
        multiplier: 0,
        muted: true
      })
      model.cents.add(set, {
        wave: $scope.waveform
      })
    } else {
      model.strings.add(set, {
        wave: $scope.waveform
      })
    }
  }

  copySet() {
    const { model, selection, $scope } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    if (!isEmpty(selectedPitches)) {
      selectedPitches.forEach(pitch => {
        const newSet = model.sets.addAfter(pitch, {
          muted: pitch.muted,
          retune: pitch.retune
        })
        const type = model.harmonics.isStringSet(pitch) ? 'strings' : 'cents'
        pitch[type].forEach(element => {
          model[type].add(newSet, {
            muted: element.muted,
            multiplier: element.multiplier,
            wave: element.wave
          })
        })
      })

      // TODO: BUG-os!!!!! indexOf helyett findIndex és pluck('id')
      selection.pitches.clear()
      selection.pitches.add(map(indexOf(__, selectedPitches), selectedPitches))
    }
  }

  canMoveDownSet() {
    const { $scope } = this._

    const selection = this._.selection.pitches
    const setSize = $scope.sets.length

    return setSize > 0 && !selection.isEmpty() && !selection.isSelected(setSize - 1)
  }

  canMoveUpSet() {
    const { $scope } = this._

    const selection = this._.selection.pitches

    return !isEmpty($scope.sets) && !selection.isEmpty() && !selection.isSelected(0)
  }

  moveDownSet() {
    const { $scope, model } = this._
    const selection = this._.selection.pitches
    // TODO !!!

    if (this.canMoveDownSet()) {
      reverse(selection).forEach(pitch => {
        const sets = $scope.sets
        const index = sets.indexOf(pitch)
        const tmp = sets[index + 1]
        sets[index + 1] = sets[index]
        sets[index] = tmp
      })
      model.updateOrder()
    }
  }

  moveUpSet() {
    const { $scope, model } = this._
    const selection = this._.selection.pitches
    // TODO !!!

    if (this.canMoveUpSet()) {
      selection.forEach(pitch => {
        const sets = $scope.sets
        const index = sets.indexOf(pitch)
        const tmp = sets[index - 1]
        sets[index - 1] = sets[index]
        sets[index] = tmp
      })
      model.updateOrder()
    }
  }

  isStringSet(set) {
    const { model } = this._

    return model.harmonics.isStringSet(set)
  }

  addElement() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    selectedPitches.forEach(pitch => {
      model[model.harmonics.isStringSet(pitch) ? 'strings' : 'cents'].add(pitch.id, {
        wave: $scope.waveform
      })
    })
  }

  toggleSelectedElement(element) {
    const { $scope } = this._

    $scope.ui.model.selectedElement = $scope.ui.model.selectedElement === element ? null : element
  }

  selectSet(pitchIdx) {
    const { selection } = this._

    if (selection.pitches.isSelected(pitchIdx)) {
      selection.pitches.clear()
    } else {
      selection.pitches.clear()
      selection.pitches.add(pitchIdx)
    }

    // TODO: range selection
    // const isShiftPressed = $scope.system.shiftPressed
  }

  clearSelection() {
    const { $scope, selection } = this._

    if ($scope.ui.model.selectedElement !== null) {
      $scope.ui.model.selectedElement = null
    } else {
      selection.pitches.clear()
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

  hasSelectedPitches() {
    const { selection } = this._
    return !selection.pitches.isEmpty()
  }

  isPitchSelected(pitchIdx) {
    const { selection } = this._
    return selection.pitches.isSelected(pitchIdx)
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

  canHalve() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    return (
      !selection.pitches.isEmpty() && all(pitch => model.harmonics.canHalve(pitch), selectedPitches)
    )
  }

  halve() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    selectedPitches.forEach(pitch => model.harmonics.halve(pitch))
  }

  canLower() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    return (
      !selection.pitches.isEmpty() && all(pitch => model.harmonics.canLower(pitch), selectedPitches)
    )
  }

  lower() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    selectedPitches.forEach(pitch => model.harmonics.lower(pitch))
  }

  canRaise() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    return (
      !selection.pitches.isEmpty() && all(pitch => model.harmonics.canRaise(pitch), selectedPitches)
    )
  }

  raise() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    selectedPitches.forEach(pitch => model.harmonics.raise(pitch))
  }

  canDouble() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    return (
      !selection.pitches.isEmpty() &&
      all(pitch => model.harmonics.canDouble(pitch), selectedPitches)
    )
  }

  double() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    selectedPitches.forEach(pitch => model.harmonics.double(pitch))
  }

  canNormalize() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    return (
      !selection.pitches.isEmpty() &&
      all(pitch => {
        return model.harmonics.canBeNormalized(
          pitch,
          model.harmonics.isStringSet(pitch) ? Model.TYPE.STRING : Model.TYPE.CENT
        )
      }, selectedPitches)
    )
  }

  normalize() {
    const { selection, $scope, model } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    selectedPitches.forEach(pitch => {
      model.harmonics.normalize(
        pitch,
        model.harmonics.isStringSet(pitch) ? Model.TYPE.STRING : Model.TYPE.CENT
      )
    })
  }

  deleteSelectedPitches() {
    const { $scope, model } = this._

    const selection = this._.selection.pitches

    selection.mapTo($scope.sets).forEach(pitch => model.sets.remove(pitch))
    selection.clear()
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
      ;[a, b] = [b, a]
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
    const { ratios, model } = this._

    const setCopy = clone(set)
    this.normalize(setCopy)

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
            model.harmonics.canHalve(set)
              ? ` ( ${
                  this.isStringSet(setCopy) ? `${bigger} : ${smaller}` : `${bigger - smaller}¢`
                } )`
              : ''
          }`
        : ''
    }

    return ret
  }

  isAllSelectionMuted() {
    const { selection, $scope } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)

    return !selection.pitches.isEmpty() && all(propEq('muted', true), selectedPitches)
  }

  toggleSelectionMuted() {
    const { selection, $scope } = this._
    const selectedPitches = selection.pitches.mapTo($scope.sets)
    const isAllMuted = this.isAllSelectionMuted()

    selectedPitches.forEach(pitch => {
      pitch.muted = !isAllMuted
    })
  }
}

export default ModelUI
