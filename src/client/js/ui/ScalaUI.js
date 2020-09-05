/* global fetch, history */

import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/theme/mbo.css'

import {
  subtract,
  flip,
  sort,
  join,
  compose,
  map,
  forEach,
  has,
  isEmpty,
  reject,
  prop,
  propEq
} from 'ramda'

import monochord from 'monochord-core'
import Model from '../Model'

import Converter from '../Converter'
import { safeApply, minAll, maxAll, roundToNDecimals } from '../helpers'
import * as stats from '../stats'
import EventBus from '../EventBus'

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
  const step = parseFloat(
    multiply(fractionToCents(ratioToFraction.apply(null, harmonicsOfRatio)), 1e6 / n).toString()
  )
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

function normalizeMultipliers(multipliers, type, model) {
  if (type === Model.TYPE.CENT) {
    const lowest = minAll(multipliers)
    if (lowest > model._lowestCent) {
      multipliers = multipliers.map(function (cent) {
        return roundToNDecimals(5, cent - lowest)
      })
    }
  } else {
    const gcd = parseInt(findGreatestCommonDivisorArray(multipliers).toString())
    if (multipliers.length > 1 && gcd > 1) {
      multipliers = multipliers.map(function (string) {
        return string / gcd
      })
    }
  }

  return multipliers
}

function exportSession($scope, model) {
  let prev = 0
  let rows = $scope.sets
    .map(function (set) {
      const type = model.harmonics.isStringSet(set) ? Model.TYPE.STRING : Model.TYPE.CENT
      let multipliers = model.harmonics.getMultipliers(set, type)

      if (multipliers.length > 1) {
        // try removing duplicates
        multipliers = multipliers.filter((item, index, arr) => {
          return arr.indexOf(item) === index
        })

        if (multipliers.length > 1) {
          // try simplification
          multipliers = normalizeMultipliers(multipliers, type, model)

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
              row.multipliers = [minAll(multipliers)]
              row.removed = scalaPrintRatio([maxAll(multipliers)])
            }
          } else {
            row.type = 'cent'
            if (multipliers.length === 1) {
              row.multipliers = multipliers
            } else {
              row.multipliers = [minAll(multipliers)]
              row.removed = scalaPrintCent(maxAll(multipliers))
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
                -parseFloat(
                  fractionToCents(ratioToFraction(multipliers[0], multipliers[1])).toString()
                )
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
                parseFloat(
                  add(
                    fractionToCents(ratioToFraction(multipliers[0], multipliers[1])),
                    prev
                  ).toString()
                )
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
          ? parseFloat(
              fractionToCents(
                ratioToFraction(row.multipliers[0], row.multipliers[1] || 1)
              ).toString()
            )
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

  rows = compose(
    reject(prop('muted')),
    reject(propEq('multipliers', [1])),
    reject(propEq('multipliers', [0]))
  )(rows)

  let scl = '!\n'
  scl += `! ${exporterBanner}\n`
  scl += '!\n'
  scl += `${$scope.name.trim() || 'Unnamed Scale'}\n`
  scl += ` ${rows.length}\n`
  scl += '!\n'
  scl += compose(
    join('\n'),
    map(row => {
      let str =
        row.type === 'ratio' ? scalaPrintRatio(row.multipliers) : scalaPrintCent(row.multipliers[0])

      // TODO: comments don't work for some reason
      // we might do simplifications, but we don't keep the information about it to this point
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
    })
  )(rows)

  return scl
}

const fetchSCL = (() => {
  const cache = {}

  return async filename => {
    if (!cache[filename]) {
      const response = await fetch(filename)
      cache[filename] = response.text()
    }

    return cache[filename]
  }
})()

const download = (filename, text) => {
  const element = document.createElement('a')
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
  element.setAttribute('download', filename)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}

// ------------------------------

class ScalaUI {
  constructor($scope, model) {
    this._ = {
      $scope,
      model,
      editorRef: null,
      converter: new Converter($scope, model),
      watchGuards: {
        sets: true,
        name: true,
        edx: true
      }
    }

    $scope.ui.scala = {
      parsedData: {},
      success: null,
      error: {},
      importTextField: '',
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
      },
      popular: [
        {
          name: '12ED(2/1)',
          link:
            '/listen/1:1-100.0-200.0-300.0-400.0-500.0-600.0-700.0-800.0-900.0-1000.0-1100.0-2:1/name:12ED(2[slash]1)/labels:C-C[hashtag]-D-D[hashtag]-E-F-F[hashtag]-G-G[hashtag]-A-A[hashtag]-B-C'
        },
        {
          name: '12 JI - 7 limit',
          link:
            '/listen/1:1-16:15-9:8-6:5-5:4-4:3-7:5-3:2-8:5-5:3-9:5-15:8-2:1/name:12%20JI%20[dash]%207%20limit/labels:C-C[hashtag]-D-D[hashtag]-E-F-F[hashtag]-G-G[hashtag]-A-A[hashtag]-B-C'
        },
        {
          name: 'Carlos Alpha - 9ED(3/2)',
          link:
            '/listen/1:1-77.995-155.99-233.985-311.98-389.975-467.970001-545.965001-623.960001-3:2/name:Carlos%20Alpha%20[dash]%209ED(3[slash]2)/labels:---------'
        },
        {
          name: 'Bohlen-Pierce JI',
          link:
            '/listen/1:1-27:25-25:21-9:7-7:5-75:49-5:3-9:5-49:25-15:7-7:3-63:25-25:9-3:1/name:Bohlen[dash]Pierce%20JI/labels:C--D-E-F--G-H--J-A--B-C'
        },
        {
          name: 'Carlos Beta - 11ED(3/2)',
          link:
            '/listen/1:1-63.814091-127.628182-191.442273-255.256364-319.070455-382.884546-446.698637-510.512728-574.326819-638.14091-3:2/name:Carlos%20Beta%20[dash]%2011ED(3[slash]2)/labels:-----------'
        },
        {
          name: 'Carlos Gamma - 20ED(3/2)',
          link:
            '/listen/1:1-35.09775-70.1955-105.29325-140.391-175.48875-210.5865-245.68425-280.782-315.87975-350.9775-386.07525-421.173001-456.270751-491.368501-526.466251-561.564001-596.661751-631.759501-666.857251-3:2/name:Carlos%20Gamma%20[dash]%2020ED(3[slash]2)/labels:--------------------'
        }
      ]
    }

    $scope.$watchGroup(['ui.scala.EDx.n', 'ui.scala.EDx.x.first', 'ui.scala.EDx.x.second'], () => {
      if (this._.watchGuards.edx) {
        this._.watchGuards.edx = false
      } else {
        this.generateEDxToEditor()
      }
    })
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

    if (isEmpty($scope.sets)) {
      this.generateEDxToEditor()
    } else {
      // TODO: we need setTimeout(), because exportSessionToEditor() relies on
      // watchGuards.sets and watchGuards.name to be false
      // we set those initially true, because the watches above will always run in the beginning
      // but they work in an async fashion and we don't track when their 1st run finishes
      setTimeout(() => {
        this.exportSessionToEditor()
      }, 100)
    }
  }

  async importSCL(filename = null) {
    const { $scope, converter } = this._

    if (filename !== null) {
      try {
        await this.loadSclToEditor(filename)
      } catch (e) {
        this.generalError(`Failed to load ${filename}`)
        return
      }
    }

    const raw = $scope.ui.scala.importTextField
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<br>/g, '\n')
      .replace(/<\/div>/g, '')

    if (raw) {
      converter
        .load(raw, Converter.types.SCALA, true)
        .then(data => {
          stats.onScaleImport(data.description)
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

    EventBus.emit('scale imported')
  }

  download() {
    const { $scope } = this._
    const name = $scope.name.trim().toLowerCase().replace(/\W+/g, '-') || 'unnamed-scale'
    const content = $scope.ui.scala.importTextField

    download(`${name}.scl`, content)
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

  async loadSclToEditor(filename) {
    const { $scope } = this._
    if (filename !== null && filename !== 'custom') {
      $scope.ui.scala.importTextField = await fetchSCL(filename)
      removeMessages($scope)
      safeApply($scope)
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
    if (
      Number.isInteger($scope.ui.scala.EDx.x.first) &&
      Number.isInteger($scope.ui.scala.EDx.x.second)
    ) {
      $scope.ui.scala.importTextField = generateEDx($scope.ui.scala.EDx.n, [
        $scope.ui.scala.EDx.x.first,
        $scope.ui.scala.EDx.x.second
      ])
      removeMessages($scope)
    }
  }

  generateEDx() {
    this.generateEDxToEditor()
    this.importSCL()
  }

  loadURL(url) {
    history.pushState({}, '', url)
    EventBus.emit('url changed')
  }
}

CodeMirror.defineSimpleMode('scala.scl', {
  start: [
    { regex: / \d+(\/|\.)\d+/, token: 'number' },
    { regex: /!.*/, token: 'comment' }
  ]
})

export default ScalaUI
