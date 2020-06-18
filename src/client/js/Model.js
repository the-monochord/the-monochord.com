import { forEach, includes, evolve, pluck, concat, append, either, __, compose, prop, map, toString } from 'ramda'
import Calculate from './model/Calculate'
import Element from './model/Elements'
import Harmonics from './model/Harmonics'
import Piano from './model/Piano'
import Retune from './model/Retune'
import Sets from './model/Sets'
import AudioModel from './AudioModel'
import MIDI from './Midi'

import { NOP } from './helpers'

const midi = new MIDI()

/*
$scope.sets = [{
  id : <int>, // setId
  muted : <bool>
  cents : [{
    id : <int>, // centId
    multiplier : <float>,
    muted : <bool>
  }, ...],
  strings : [{
    id : <int>, // stringId
    multiplier : lowestHarmonic..highestHarmonic,
    muted : <bool>
  }, ...],
  retune : <string>
}, ...];
*/

class Model {
  constructor($scope, staticPathSecure) {
    const self = this

    const audioModel = new AudioModel(staticPathSecure)
    let _oldValue = NOP

    let webAudioEnabled = false

    this._lastSetId = 0
    this._lastElementId = 0

    this._lowestBaseFrequency = 0
    this._highestBaseFrequency = 10000

    this._lowestHarmonic = 1
    this._highestHarmonic = 1e6
    this._lowestCent = 0
    this._highestCent = Infinity

    this.commit = function() {
      $scope.$apply()
    }

    this.retune = new Retune(this, $scope)
    this.sets = new Sets(this, $scope)
    this.strings = new Element(this, $scope, Model.TYPE.STRING)
    this.cents = new Element(this, $scope, Model.TYPE.CENT)
    this.harmonics = new Harmonics(this)
    this.calculate = new Calculate(this, $scope)
    this.piano = new Piano($scope, audioModel, midi)
    this.midi = midi

    this.webAudioSupported = AudioModel.supported
    this.getwaveforms = () => {
      if (webAudioEnabled) {
        return audioModel.getWave().getTypes()
      } else {
        return []
      }
    }

    this.getOrder = () => map(compose(toString, prop('id')))($scope.sets)

    this.updateOrder = () => {
      audioModel.updateOrder(self.getOrder())
    }

    this._forceUpdate = () => {
      _oldValue = []
      scopeChanged()
    }

    this.isAudioEnabled = () => webAudioEnabled
    this.enableAudio = () => {
      if (!webAudioEnabled) {
        audioModel.enableAudio()
        audioModel.updateSynth($scope)
        webAudioEnabled = true
      }
    }

    // -----------------

    function diffScopeChange(newValue, oldValue) {
      let sets = {
        added: [],
        removed: [],
        changed: []
      }
      let strings = {
        added: [],
        removed: [],
        changed: []
      }
      let cents = {
        added: [],
        removed: [],
        changed: []
      }

      newValue.forEach(newSet => {
        let group = 'added'
        let oldSet
        oldValue.some(_oldSet => {
          if (_oldSet.id === newSet.id) {
            oldSet = _oldSet
            group = 'changed'
            return true
          }
        })

        sets[group].push(newSet.id)

        forEach(newString => {
          strings[
            group !== 'added' && oldSet.strings.some(oldString => oldString.id === newString.id) ? 'changed' : 'added'
          ].push(newString.id)
        })(newSet.strings)

        forEach(newCent => {
          cents[
            group !== 'added' && oldSet.cents.some(oldCent => oldCent.id === newCent.id) ? 'changed' : 'added'
          ].push(newCent.id)
        })(newSet.cents)
      })

      forEach(oldSet => {
        if (either(includes(__, sets.added), includes(__, sets.changed))(oldSet.id)) {
          forEach(oldString => {
            if (!includes(oldString.id, strings.added) && !includes(oldString.id, strings.changed)) {
              strings.removed.push(oldString.id)
            }
          })(oldSet.strings)

          forEach(oldCent => {
            if (!includes(oldCent.id, cents.added) && !includes(oldCent.id, cents.changed)) {
              cents.removed.push(oldCent.id)
            }
          })(oldSet.cents)
        } else {
          sets = evolve({
            removed: append(oldSet.id)
          })(sets)
          strings = evolve({
            removed: concat(pluck('id')(oldSet.strings))
          })(strings)
          cents = evolve({
            removed: concat(pluck('id')(oldSet.cents))
          })(cents)
        }
      })(oldValue)

      return {
        sets,
        strings,
        cents
      }
    }

    function applyScopeChangeDiff(diff) {
      forEach(audioModel.removeSet)(diff.sets.removed)

      forEach(setId => {
        self.sets.findById(setId, set => {
          audioModel.addSet(setId, {
            muted: set.muted
          })
        })
      })(diff.sets.added)

      forEach(setId => {
        self.sets.findById(setId, set => {
          audioModel.setSet(setId, {
            muted: set.muted
          })
        })
      }, diff.sets.changed)

      // ----------------

      forEach(audioModel.removeString)(diff.strings.removed)

      forEach(stringId => {
        self.strings.findById(stringId, (string, index, array, set) => {
          audioModel.addString(stringId, set.id, {
            frequency: self.calculate.frequency(stringId, Model.TYPE.STRING),
            muted: string.muted,
            wave: string.wave
          })
        })
      })(diff.strings.added)

      forEach(stringId => {
        self.strings.findById(stringId, string => {
          audioModel.setString(stringId, {
            frequency: self.calculate.frequency(stringId, Model.TYPE.STRING),
            muted: string.muted,
            wave: string.wave
          })
        })
      })(diff.strings.changed)

      // ----------------

      forEach(audioModel.removeCent)(diff.cents.removed)

      forEach(centId => {
        self.cents.findById(centId, (cent, index, array, set) => {
          audioModel.addCent(centId, set.id, {
            frequency: self.calculate.frequency(centId, Model.TYPE.CENT),
            muted: cent.muted,
            wave: cent.wave
          })
        })
      })(diff.cents.added)

      forEach(centId => {
        self.cents.findById(centId, cent => {
          audioModel.setCent(centId, {
            frequency: self.calculate.frequency(centId, Model.TYPE.CENT),
            muted: cent.muted,
            wave: cent.wave
          })
        })
      })(diff.cents.changed)

      audioModel.updateSynth($scope)
      audioModel.commit()
      if (diff.sets.added.length || diff.sets.removed.length) {
        self.updateOrder()
      }
    }

    function scopeChanged() {
      applyScopeChangeDiff(diffScopeChange($scope.sets, _oldValue))
    }

    $scope.$watch(
      'sets',
      function(newValue, oldValue) {
        if ($scope.playbackMode === AudioModel.MODES.NORMAL) {
          _oldValue = oldValue
          scopeChanged()
        }
      },
      true
    )

    $scope.$watch('baseFrequency', function(newValue) {
      let dirty = false

      $scope.sets.forEach(set => {
        set.strings.forEach(string => {
          dirty = true
          audioModel.setString(string.id, {
            frequency: self.calculate.frequency(string, Model.TYPE.STRING)
          })
        })

        set.cents.forEach(cent => {
          dirty = true
          audioModel.setCent(cent.id, {
            frequency: self.calculate.frequency(cent, Model.TYPE.CENT)
          })
        })
      })

      if (dirty) {
        audioModel.updateSynth($scope)
        audioModel.commit()
      }
    })

    $scope.$watch('baseVolume', function(newValue) {
      audioModel.updateSynth($scope)
      audioModel.setMainVolume(newValue / 100).commit()
    })

    $scope.$watch(
      'retune',
      function(newValue, oldValue) {
        if (newValue.default === oldValue.default) {
          return
        }

        let dirty = false

        // todo: can we extract this and the above copy into an "update frequencies" method?
        $scope.sets.forEach(set => {
          if (set.retune !== 'inherit') {
            return
          }

          set.strings.forEach(string => {
            dirty = true
            audioModel.setString(string.id, {
              frequency: self.calculate.frequency(string, Model.TYPE.STRING)
            })
          })

          set.cents.forEach(cent => {
            dirty = true
            audioModel.setCent(cent.id, {
              frequency: self.calculate.frequency(cent, Model.TYPE.CENT)
            })
          })
        })

        if (dirty) {
          audioModel.commit()
        }
      },
      true
    )

    $scope.$watch('playbackMode', function() {
      if ($scope.playbackMode === AudioModel.MODES.NORMAL) {
        scopeChanged()
      } else if ($scope.playbackMode === AudioModel.MODES.PIANO) {
        _oldValue = JSON.parse(JSON.stringify($scope.sets))
      }
    })

    $scope.$watch('waveform', function(value) {
      if ($scope.playbackMode === AudioModel.MODES.PIANO) {
        $scope.sets.forEach(set => {
          set.strings.forEach(string => {
            audioModel.setString(string.id, {
              wave: value
            })
          })
          set.cents.forEach(cent => {
            audioModel.setCent(cent.id, {
              wave: value
            })
          })
        })

        audioModel.updateSynth($scope)
        audioModel.commit()
      }
    })

    $scope.$watch(
      'synth',
      function() {
        audioModel.updateSynth($scope)
      },
      true
    )
  }
}

Model.TYPE = {
  STRING: 'string',
  CENT: 'cent'
}

export default Model
