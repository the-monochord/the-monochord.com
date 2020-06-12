/* global fetch */

import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/theme/mbo.css'

import { subtract, flip, sort, join, compose, map, filter, forEach, has } from 'ramda'

import monochord from 'monochord-core'
import Model from '../Model'

import Converter from '../Converter'
import { safeApply } from '../helpers'

const {
  convert: { fractionToCents, ratioToFraction },
  math: { findGreatestCommonDivisorArray, multiply, add }
} = monochord

// ------------------------------

const generatorBanner = 'Generated with The Monochord(the-monochord.com)'
const exporterBanner = 'Exported from The Monochord(the-monochord.com)'

const scalaPrintRatio = compose(join('/'), sort(flip(subtract)))

function scalaPrintCent(n) {
  if (n % 1 === 0) {
    return `${n}.0`
  } else {
    return Math.round(n * 1e6) / 1e6
  }
}

function generateEDx(n, harmonicsOfRatio) {
  const step = parseFloat(multiply(fractionToCents(ratioToFraction.apply(null, harmonicsOfRatio)), 1e6 / n).toString())
  const ratio = scalaPrintRatio(harmonicsOfRatio)

  let scl = '!\n'
  scl += `! ${generatorBanner}\n`
  scl += '!\n'
  scl += `${n}ED(${ratio})\n`
  scl += ` ${n}\n`
  scl += '!\n'
  for (let i = 1; i <= n - 1; i++) {
    const tmp = Math.round(i * step) / 1e6
    scl += ` ${scalaPrintCent(tmp)}\n`
  }
  scl += ` ${ratio}`

  return scl
}

function removeMessages($scope) {
  $scope.ui.scala.parsedData = {}
  $scope.ui.scala.error = {}
  $scope.ui.scala.success = null
}

function normaliseMultipliers(multipliers, type, model) {
  if (type === Model.TYPE.CENT) {
    const lowest = Math.min.apply(null, multipliers)
    if (lowest > model._lowestCent) {
      multipliers = multipliers.map(function(cent) {
        return Math.round((cent - lowest) * 10000) / 10000
      })
    }
  } else {
    const gcd = parseInt(findGreatestCommonDivisorArray(multipliers).toString())
    if (multipliers.length > 1 && gcd > 1) {
      multipliers = multipliers.map(function(string) {
        return string / gcd
      })
    }
  }

  return multipliers
}

function exportSession($scope, model) {
  let scl = '!\n'
  scl += `! ${exporterBanner}\n`
  scl += '!\n'
  scl += `${$scope.name.trim() || 'Unnamed Scale'}\n`
  scl += ` ${
    $scope.sets.filter(function(set) {
      return !set.muted
    }).length
  }\n`
  scl += '!\n'

  let prev = 0
  const rows = $scope.sets
    .map(function(set) {
      const type = Model.TYPE[model.harmonics.isStringSet(set) ? 'STRING' : 'CENT']
      let multipliers = model.harmonics.getMultipliers(set, type)

      if (multipliers.length > 1) {
        // try removing duplicates
        multipliers = multipliers.filter((item, index, arr) => {
          return arr.indexOf(item) === index
        })

        if (multipliers.length > 1) {
          // try simplification
          multipliers = normaliseMultipliers(multipliers, type, model)

          // should reduce to 2
          if (multipliers.length > 2) {
            multipliers = multipliers
              .sort(
                $scope.retune.default === 'highestToBaseFreq'
                  ? flip(subtract) // get 2 highest
                  : subtract // get 2 lowest
              )
              .slice(0, 2)
          }
        }
      }

      const row = {
        muted: set.muted
      }

      switch ($scope.retune.default) {
        case 'off':
          if (type === Model.TYPE.STRING) {
            row.type = 'ratio'
            if (multipliers.length === 1) {
              row.multipliers = multipliers
            } else {
              row.multipliers = [Math.min.apply(null, multipliers)]
              row.removed = scalaPrintRatio([Math.max.apply(null, multipliers)])
            }
          } else {
            row.type = 'cent'
            if (multipliers.length === 1) {
              row.multipliers = multipliers
            } else {
              row.multipliers = [Math.min.apply(null, multipliers)]
              row.removed = scalaPrintCent(Math.max.apply(null, multipliers))
            }
          }
          break
        case 'lowestToBaseFreq':
          if (type === Model.TYPE.STRING) {
            row.type = 'ratio'
            if (multipliers.length === 1) {
              row.multipliers = [1]
              row.transformed = scalaPrintRatio(multipliers)
            } else {
              row.multipliers = multipliers
            }
          } else {
            row.type = 'cent'
            if (multipliers.length === 1) {
              row.multipliers = [0]
              row.transformed = scalaPrintCent(multipliers[0])
            } else {
              row.multipliers = [Math.abs(multipliers[0] - multipliers[1])]
            }
          }
          break
        case 'highestToBaseFreq':
          row.type = 'cent'
          if (type === Model.TYPE.STRING) {
            if (multipliers.length === 1) {
              row.multipliers = [0]
              row.transformed = scalaPrintRatio(multipliers)
            } else {
              row.multipliers = [
                -parseFloat(fractionToCents(ratioToFraction(multipliers[0], multipliers[1])).toString())
              ]
            }
          } else {
            if (multipliers.length === 1) {
              row.multipliers = [0]
              row.transformed = scalaPrintCent(multipliers[0])
            } else {
              row.multipliers = [-Math.abs(multipliers[0] - multipliers[1])]
            }
          }
          break
        case 'lowestToPrevHighest':
          row.type = 'cent'
          if (type === Model.TYPE.STRING) {
            if (multipliers.length === 1) {
              row.multipliers = [prev]
              row.transformed = scalaPrintRatio(multipliers)
            } else {
              row.multipliers = [
                parseFloat(add(fractionToCents(ratioToFraction(multipliers[0], multipliers[1])), prev).toString())
              ]
              row.transformed = scalaPrintRatio(multipliers)
            }
          } else {
            if (multipliers.length === 1) {
              row.multipliers = [prev]
              row.transformed = scalaPrintCent(multipliers[0])
            } else {
              row.multipliers = [Math.abs(multipliers[0] - multipliers[1]) + prev]
              row.transformed = scalaPrintCent(Math.abs(multipliers[0] - multipliers[1]))
            }
          }

          prev = row.multipliers[0]
          break
      }

      row.cents =
        row.type === 'ratio'
          ? parseFloat(fractionToCents(ratioToFraction(row.multipliers[0], row.multipliers[1] || 1)).toString())
          : row.multipliers[0]

      return row
    })
    .sort((a, b) => a.cents - b.cents)

  if ($scope.retune.default === 'highestToBaseFreq') {
    const diff = rows[rows.length - 1].cents - rows[0].cents || -rows[0].cents
    forEach(row => {
      row.multipliers[0] += diff
      row.cents += diff
    }, rows)
  }

  scl += compose(
    join('\n'),
    map(row => {
      let str = row.type === 'ratio' ? scalaPrintRatio(row.multipliers) : scalaPrintCent(row.multipliers[0])

      const comment = []

      if (has('transformed', row) && row.transformed !== str) {
        comment.push(`was ${row.transformed}`)
      }

      if (has('removed', row) && row.removed !== str) {
        comment.push(`removed ${row.removed}`)
      }

      if (comment.length) {
        str += ` ! ${comment.join('; ')}`
      }

      return ` ${str}`
    }),
    filter(row => !row.muted)
  )(rows)

  return scl
}

// ------------------------------

class ScalaUI {
  constructor($scope, model) {
    this._ = {
      $scope,
      model,
      editorRef: null,
      converter: new Converter($scope, model),
      presetCache: {},
      watchGuards: {
        sets: false,
        name: false
      }
    }

    $scope.ui.scala = {
      parsedData: {},
      success: null,
      error: {},
      importTextField: '',
      presetList: {},
      EDx: {
        n: 12,
        x: {
          first: 2,
          second: 1
        }
      },
      editorOptions: {
        mode: 'scala.scl',
        lineNumbers: true,
        lineWrapping: true,
        theme: 'mbo',
        tabSize: 1,
        indentWithTabs: false,
        indentUnit: 1,
        allowDropFileTypes: ['text/scala.scl'],
        viewportMargin: Infinity
      },
      onEditorLoaded: editor => {
        this._.editorRef = editor
      }
    }

    $scope.$watchGroup(['name', 'retune.default'], () => {
      if (this._.watchGuards.name) {
        this._.watchGuards.name = false
      } else {
        this.exportSessionToEditor()
      }
    })
    $scope.$watch(
      'sets',
      () => {
        if (this._.watchGuards.sets) {
          this._.watchGuards.sets = false
        } else {
          this.exportSessionToEditor()
        }
      },
      true
    )

    $scope.$watchGroup(['ui.scala.EDx.n', 'ui.scala.EDx.x.first', 'ui.scala.EDx.x.second'], () =>
      this.generateEDxToEditor()
    )

    this.fetchPresetList($scope)
  }

  async fetchPresetList($scope) {
    const response = await fetch('/presetlist')
    const data = await response.json()

    $scope.ui.scala.presetList = data
    safeApply($scope)
  }

  importSCL() {
    const { $scope, converter } = this._
    const raw = $scope.ui.scala.importTextField
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<br>/g, '\n')
      .replace(/<\/div>/g, '')

    if (raw) {
      converter
        .load(raw, Converter.types.SCALA, true)
        .then(data => {
          $scope.ui.scala.success = true
          $scope.ui.scala.parsedData = data
          $scope.ui.scala.error = {}
          $scope.$apply(() => {
            this._.watchGuards.name = true
            this._.watchGuards.sets = true
            $scope.sets = []
            converter.injectIntoModel(data)
          })
        })
        .catch(error => {
          $scope.ui.scala.success = false
          $scope.ui.scala.parsedData = error.report.data
          $scope.ui.scala.error = error.report
          $scope.$apply()
        })
    }
  }

  refreshEditor() {
    const { editorRef } = this._
    if (editorRef) {
      setTimeout(() => {
        editorRef.refresh()
      }, 10)
    }
  }

  generalError(message) {
    const { $scope } = this._
    $scope.ui.scala.error = {
      message
    }
  }

  loadSclToEditor(fileName) {
    const { $scope, presetCache } = this._
    if (fileName !== null && fileName !== 'custom') {
      if (!presetCache[fileName]) {
        fetch(fileName)
          .then(response => response.text())
          .then(data => {
            presetCache[fileName] = data
            $scope.ui.scala.importTextField = data
            removeMessages($scope)
          })
          .catch(() => {
            this.generalError(`Failed to load ${fileName}`)
          })
          .finally(() => {
            safeApply($scope)
          })
      } else {
        $scope.ui.scala.importTextField = presetCache[fileName]
        removeMessages($scope)
      }
    }
  }

  exportSessionToEditor() {
    const { $scope, model, watchGuards } = this._

    if (!watchGuards.name && !watchGuards.sets) {
      $scope.ui.scala.importTextField = exportSession($scope, model)
      removeMessages($scope)
    }
  }

  generateEDxToEditor() {
    const { $scope } = this._
    if (Number.isInteger($scope.ui.scala.EDx.x.first) && Number.isInteger($scope.ui.scala.EDx.x.second)) {
      $scope.ui.scala.importTextField = generateEDx($scope.ui.scala.EDx.n, [
        $scope.ui.scala.EDx.x.first,
        $scope.ui.scala.EDx.x.second
      ])
      removeMessages($scope)
    }
  }
}

CodeMirror.defineSimpleMode('scala.scl', {
  start: [
    { regex: / \d+(\/|\.)\d+/, token: 'number' },
    { regex: /!.*/, token: 'comment' }
  ]
})

export default ScalaUI
