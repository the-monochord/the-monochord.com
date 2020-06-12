import {
  curry,
  pathOr,
  compose,
  replace,
  keys,
  filter,
  propEq,
  forEach,
  memoizeWith,
  equals,
  reject,
  join,
  map,
  ifElse,
  always,
  all,
  when,
  isNil,
  pluck,
  findIndex,
  inc,
  propOr,
  has
} from 'ramda'

import monochord from 'monochord-core'

import { safeApply } from '../helpers'
import AudioModel from '../AudioModel'
import Model from '../Model'
import { postfix } from '../../../common/helpers'

const {
  midi: {
    constants: { middleC }
  }
} = monochord

const prefixPattern = /^[+-]*/

const getSetById = curry((rawId, model) =>
  compose(id => model.sets.findById(id), parseInt, replace(prefixPattern, ''))(rawId)
)

const getIdByNote = curry((note, notes) => {
  const octaves = notes.length
  const octaveOffset = Math.floor(octaves / 2)
  const notesPerOctave = notes[0].length - 1

  const octave = Math.floor((note - middleC) / notesPerOctave) + octaveOffset
  let noteIndex = (note - middleC) % notesPerOctave
  if (noteIndex < 0) {
    noteIndex = notesPerOctave + noteIndex
  }

  return pathOr(null, [octave, noteIndex])(notes)
})

const getIdByLabel = curry((label, notes) => {
  const prefix = label.match(prefixPattern)[0]
  const prefixes = map(replace(/\d+$/, ''), pluck(0, notes))
  const octaveIdx = findIndex(equals(prefix), prefixes)

  if (octaveIdx === -1) {
    return null
  }

  const noteIdx = parseInt(label.replace(prefixPattern, '')) - 1

  const note = notes[octaveIdx][noteIdx]

  if (isNil(note)) {
    return null
  } else {
    return note
  }
})

const updateStatus = curry(($scope, status) => {
  $scope.ui.midi.status = status
  safeApply($scope)
})

const getSustainedNoteIDs = compose(keys, filter(propEq('sustained', true)))

const labelCalculator = memoizeWith(
  params => `${params.mode}|${params.rawId}|${params.hash}`,
  ({ mode, rawId, model }) => {
    let label = ''

    if (mode === 'pitches') {
      const id = parseInt(rawId.replace(prefixPattern, ''))
      model.sets.findById(id, (set, index, array) => {
        label = index + 1
      })
    } else {
      const set = getSetById(rawId, model)
      const isStringSet = model.harmonics.isStringSet(set)
      const type = Model.TYPE[isStringSet ? 'STRING' : 'CENT']

      const multipliers = model.harmonics
        .getMultipliers(set, type)
        .map(multiplier => Math.round(multiplier * 100) / 100)

      switch (mode) {
        case 'normal':
          label = multipliers.map(postfix(isStringSet ? '' : '¢')).join(':')
          break
        case 'frequency':
          label = `${model.piano.getFrequencies(rawId).join('Hz:')}Hz`
          break
        case 'cents':
          // TODO:
          // label = compose(join(':'), map(postfix('¢')), model.piano.getCents)(rawId)
          label = compose(
            join(':'),
            map(postfix('¢')),
            ifElse(all(equals(0)), always([0]), reject(equals(0))),
            when(
              always(isStringSet),
              map(multiplier => {
                const string = model.harmonics.findInSet(set, multiplier)
                return Math.round(model.calculate.cent(string) * 100) / 100
              })
            )
          )(multipliers)
          break
      }
    }

    return label
  }
)

let midi

const CHORD_MODE = Object.freeze({
  PLAY: 'play',
  RECORD: 'record'
})

class PianoUI {
  constructor($scope, model) {
    midi = model.midi
    $scope.ui.midi = {
      status: {},
      whiteOnly: false,
      pressureSensitivity: true,
      sustainOn: false,
      sustainToggle: true
    }

    $scope.ui.chords = {
      mode: CHORD_MODE.PLAY,
      keys: [
        // Sevish: Sleep deprived and cooked alive (14EDO)
        ['4', '7', '12'],
        ['5', '10', '13'],
        ['4', '7', '12'],
        ['3', '7', '11'],
        ['4', '8', '14'],
        ['6', '12', '15'],
        ['-14', '4', '8'],
        ['5', '8', '13']
      ],
      props: [
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false },
        { pressed: false, highlighted: false }
      ]
    }

    this._ = {
      $scope,
      model,
      noteTable: {},
      notes: []
    }

    $scope.$watch('playbackMode', value => {
      if (value === AudioModel.MODES.PIANO) {
        const { noteTable, notes, model } = this._
        const x = {}

        compose(
          forEach(id => {
            noteTable[id] = { pressed: false, sustained: false, highlighted: false }
            const prefix = id.match(prefixPattern)[0]
            if (!x[prefix]) {
              x[prefix] = [id]
            } else {
              x[prefix].push(id)
            }
          })
        )(model.piano.getNotes())

        const prefixes = Object.keys(x)
        const negatives = prefixes.filter(key => key[0] === '-').sort((a, b) => b.length - a.length)

        const positives = prefixes.filter(key => key[0] === '+').sort((a, b) => a.length - b.length)

        const order = model.getOrder()

        forEach(prefix => {
          notes.push(order.map(value => prefix + value).filter(value => x[prefix].includes(value)))
        }, negatives)

        notes.push(order.filter(value => x[''].includes(value)))

        forEach(prefix => {
          notes.push(order.map(value => prefix + value).filter(value => x[prefix].includes(value)))
        }, positives)
      } else if (value === AudioModel.MODES.NORMAL) {
        this._.noteTable = {}
        this._.notes = []
      }
    })

    $scope.$watch('ui.midi.whiteOnly', newValue => {
      midi.mode = newValue
    })

    $scope.$watch('ui.midi.sustainOn', value => {
      const { notes, noteTable, model } = this._

      if (notes.length && !value) {
        const ids = getSustainedNoteIDs(noteTable)

        forEach(id => {
          noteTable[id].sustained = false
          model.piano.noteOff(id)
        }, ids)
      }
    })

    midi.on('ready', updateStatus($scope))
    midi.on('update', updateStatus($scope))

    midi.on('note on', (note, velocity, channel) => {
      const { notes, $scope } = this._

      if (notes.length) {
        const id = getIdByNote(note, notes)
        if (id !== null) {
          this.noteOn(id, velocity)
        }
      }
      safeApply($scope)
    })

    midi.on('note off', (note, velocity, channel) => {
      const { notes, $scope } = this._

      if (notes.length) {
        const id = getIdByNote(note, notes)
        if (id !== null) {
          this.noteOff(id)
        }
      }
      safeApply($scope)
    })

    /*
    midi.on('aftertouch', (note, pressure, channel) => {
      console.log('aftertouch: ', note, pressure, channel)
    })
    midi.on('pitchbend', amount => {
      console.log('pitchbend: ', amount)
    })
    */

    midi.on('sustain', enabled => {
      const { $scope } = this._

      $scope.ui.midi.sustainOn = enabled

      safeApply($scope)
    })
    /*
    midi.on('all sounds off', () => {
      console.log('all sounds off')
    })
    */

    midi.init()
  }

  getNotes() {
    const { notes } = this._

    return notes
  }

  noteOn(id, velocity) {
    const { model, noteTable, $scope } = this._

    if (noteTable[id] && !this.isMuted(id)) {
      if (!this.isNoteOn(id)) {
        model.piano.noteOn(id, $scope.ui.midi.pressureSensitivity ? velocity : 100)
        noteTable[id].pressed = true
      } else if ($scope.ui.midi.sustainToggle) {
        noteTable[id].pressed = false
        noteTable[id].sustained = false
        model.piano.noteOff(id)
      }
    }
  }

  noteOff(id) {
    const { model, noteTable, $scope } = this._

    if (noteTable[id] && !this.isMuted(id)) {
      if (this.isNoteOn(id)) {
        if ($scope.ui.midi.sustainOn) {
          noteTable[id].sustained = true
        } else {
          model.piano.noteOff(id)
        }

        noteTable[id].pressed = false
      }
    }
  }

  isNoteOn(id) {
    const { noteTable } = this._

    return noteTable[id] && (noteTable[id].pressed || noteTable[id].sustained)
  }

  isMuted(id) {
    const { model } = this._

    return getSetById(id, model).muted
  }

  isHighlighted(id) {
    const { noteTable } = this._

    return noteTable[id] && noteTable[id].highlighted
  }

  noteOver(id) {
    const { $scope, noteTable } = this._

    if ($scope.ui.mousedown && noteTable[id] && !noteTable[id].pressed) {
      this.noteOn(id, 100)
    }
  }

  noteOut(id) {
    const { $scope, noteTable } = this._

    if (!$scope.ui.mousedown || (noteTable[id] && noteTable[id].pressed)) {
      this.noteOff(id)
    }
  }

  getChordKeys() {
    return map(inc, keys(this._.$scope.ui.chords.keys))
  }

  isChordOn(index) {
    return propOr(false, 'pressed', this._.$scope.ui.chords.props[index])
  }

  isChordHighlighted(index) {
    return propOr(false, 'highlighted', this._.$scope.ui.chords.props[index])
  }

  chordOn(index) {
    const { notes, $scope } = this._

    if (has(index, $scope.ui.chords.keys)) {
      compose(
        forEach(note => {
          const id = getIdByLabel(note, notes)
          if (!isNil(id)) {
            this.noteOn(id, 100)
          }
        })
      )($scope.ui.chords.keys[index])

      $scope.ui.chords.props[index].pressed = true
    }
  }

  chordOff(index) {
    const { notes, $scope } = this._

    if (has(index, $scope.ui.chords.keys)) {
      compose(
        forEach(note => {
          const id = getIdByLabel(note, notes)
          if (!isNil(id)) {
            this.noteOff(id, 100)
          }
        })
      )($scope.ui.chords.keys[index])

      $scope.ui.chords.props[index].pressed = false
    }
  }

  chordOver(index) {
    const { notes, noteTable, $scope } = this._

    if ($scope.ui.mousedown) {
      this.chordOn(index)
    }

    if (has(index, $scope.ui.chords.keys)) {
      compose(
        forEach(note => {
          const id = getIdByLabel(note, notes)
          if (!isNil(id)) {
            noteTable[id].highlighted = true
          }
        })
      )($scope.ui.chords.keys[index])

      $scope.ui.chords.props[index].highlighted = true
    }
  }

  chordOut(index) {
    const { notes, noteTable, $scope } = this._

    this.chordOff(index)

    if (has(index, $scope.ui.chords.keys)) {
      compose(
        forEach(note => {
          const id = getIdByLabel(note, notes)
          if (!isNil(id)) {
            noteTable[id].highlighted = false
          }
        })
      )($scope.ui.chords.keys[index])

      $scope.ui.chords.props[index].highlighted = false
    }
  }

  getLabel(rawId) {
    const { $scope, model } = this._

    return labelCalculator({
      mode: $scope.displayMode,
      hash: $scope.hashOfSet,
      rawId,
      model
    })
  }

  toggleDevice(type, name) {
    midi.toggleDevice(type, name)
  }

  toggleChannel(type, name, channelID) {
    midi.toggleChannel(type, name, channelID)
  }

  hasMIDIInputs() {
    const { $scope } = this._
    const midiStatus = $scope.ui.midi.status
    return midiStatus.devices && Object.keys(midiStatus.devices.inputs).length > 0
  }

  hasMIDIOutputs() {
    const { $scope } = this._
    const midiStatus = $scope.ui.midi.status
    return midiStatus.devices && Object.keys(midiStatus.devices.outputs).length > 0
  }
}

export default PianoUI
