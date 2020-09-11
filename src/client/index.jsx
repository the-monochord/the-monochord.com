/* global window, __settings, location, fetch, __INITIAL_DATA__ */

import angular from 'angular'
import ngSanitize from 'angular-sanitize'

import './js/Directive'
import {
  compose,
  forEach,
  toPairs,
  mergeDeepLeft,
  omit,
  isEmpty,
  length,
  pathOr,
  reduce,
  unapply,
  includes,
  has,
  map,
  join,
  range,
  split,
  addIndex
} from 'ramda'
import React from 'react'
import { hydrate } from 'react-dom'
import { noop } from 'ramda-adjunct'
import {
  getParametersFromArgs,
  getLastElementId,
  kvPairsToArgs,
  escape,
  unescape
} from '../common/listen'
import App from '../common/components/App'
import { sleep } from '../common/helpers/function'
import { prefixIfNotEmpty } from '../common/helpers'
import AudioModel from './js/AudioModel'
import Model from './js/Model'
import UI from './js/Ui'
import { pathToSEOData, parsePath, setSEOData, generateUrlFromState } from './js/seo'
import { safeApply, watchForHover, skipInitialWatchRun } from './js/helpers'
import PolySynth from './js/synth/gate-controllers/PolySynth'
import EventBus from './js/EventBus'

import './scss/index.scss'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/mbo.css'

const scopeToPath = (sets, waveform, props = {}) => {
  if (isEmpty(sets)) {
    return ''
  } else {
    return `${generateUrlFromState(waveform, sets)}${prefixIfNotEmpty('/', kvPairsToArgs(props))}`
  }
}

const updateSetsAndWaveform = async (
  $scope,
  model,
  { lastSetId, lastElementId, sets, waveform, onUpdate = noop }
) => {
  $scope.sets = sets
  $scope.waveform = waveform
  model._lastSetId = lastSetId
  model._lastElementId = lastElementId
  safeApply($scope)
  if (sets.length) {
    await sleep(100)
    onUpdate()
  }
}

const defaultDatas = {
  baseVolume: 30,
  baseFrequency: 262,
  waveform: 'sine',
  sets: [],
  name: '',
  retune: {
    default: 'off',
    defaultForNew: 'inherit'
  },
  synth: {
    voices: 4,
    notePriority: PolySynth.NOTE_PRIORITY.LAST
  },
  displayMode: 'normal',
  playbackMode: AudioModel.MODES.NORMAL
}

const mergeDeepLeftAll = unapply(reduce(mergeDeepLeft, {}))

angular
  .module('Monochord', ['Directive', ngSanitize, 'ui.codemirror'])
  .config([
    '$compileProvider',
    function ($compileProvider) {
      $compileProvider.debugInfoEnabled(false)
    }
  ])
  .controller('MonochordCtrl', [
    '$scope',
    function ($scope) {
      const settings = mergeDeepLeftAll(__settings, defaultDatas)

      delete window.__settings

      $scope.system = {
        shiftPressed: false,
        escapePressed: false,
        deletePressed: false,
        ctrlAPressed: false
      }

      const model = new Model($scope, settings.path.static)

      compose(
        forEach(([key, value]) => {
          $scope[key] = value
        }),
        toPairs,
        omit(['_', 'sets', 'waveform'])
      )(settings)

      updateSetsAndWaveform($scope, model, {
        lastSetId: pathOr(0, ['_', 'lastSetId'], settings),
        lastElementId: pathOr(0, ['_', 'lastElementId'], settings),
        sets: settings.sets,
        waveform: settings.waveform,
        onUpdate: () => {
          model._forceUpdate()
        }
      })

      $scope.changeUrlFeedback = false

      let seo = pathToSEOData(location.pathname)

      const handleChange = () => {
        const propsToExport = {
          name: escape($scope.name),
          labels: join(
            '-',
            map(compose(escape, pathOr('', ['label', 'alphabetical'])), $scope.sets)
          ),
          baseFrequency: escape($scope.baseFrequency)
        }

        const newSeo = pathToSEOData(scopeToPath($scope.sets, $scope.waveform, propsToExport))
        $scope.hashOfSet = JSON.stringify($scope.sets)

        if (newSeo.url !== seo.url) {
          setSEOData(newSeo, !$scope.changeUrlFeedback)
          seo = newSeo
        }
      }

      $scope.$watch('sets', skipInitialWatchRun(handleChange), true)
      $scope.$watch('waveform', skipInitialWatchRun(handleChange))
      $scope.$watch('name', skipInitialWatchRun(handleChange))
      $scope.$watch('baseFrequency', skipInitialWatchRun(handleChange))

      const updateSettings = async data => {
        const rawResponse = await fetch('/settings', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        return rawResponse.json()
      }

      $scope.$watch('theme', async (newValue, oldValue) => {
        if (newValue !== oldValue) {
          const result = await updateSettings({ theme: newValue })
          if (result.theme === newValue) {
            document.body.classList.remove(`theme-${oldValue}`)
            document.body.classList.add(`theme-${newValue}`)
          }
        }
      })
      $scope.$watch('language', async (newValue, oldValue) => {
        if (newValue !== oldValue) {
          await updateSettings({ language: newValue })
          /*
          const result = await updateSettings({ language: newValue })
          if (result.language === newValue) {
            // TODO: implement client side language change
            console.log('language changed to ' + $scope.languages[newValue] + '(' + newValue + ')')
          }
          */
        }
      })
      $scope.$watch('displayMode', async (newValue, oldValue) => {
        if (newValue !== oldValue) {
          await updateSettings({ displayMode: newValue })
        }
      })

      const onURLChange = () => {
        const newSeo = pathToSEOData(location.pathname)
        if (newSeo.url !== seo.url) {
          setSEOData(newSeo, false)
          seo = newSeo
          const { sets, waveform, props } = getParametersFromArgs(parsePath(location.pathname))

          let labels = []
          if (props.labels) {
            labels = compose(map(unescape), split('-'))(props.labels)
          }

          updateSetsAndWaveform($scope, model, {
            lastSetId: length(sets),
            lastElementId: getLastElementId(),
            sets: addIndex(map)((set, index) => {
              set.label.alphabetical = labels[index] || ''
              return set
            }, sets),
            waveform
          })

          if (props.name) {
            $scope.name = unescape(props.name)
          }
          if (!isNaN(parseFloat(props.baseFrequency))) {
            $scope.baseFrequency = parseFloat(props.baseFrequency)
          }

          safeApply($scope)
        }
      }

      window.addEventListener('popstate', () => {
        $scope.changeUrlFeedback = true
        onURLChange()
        $scope.changeUrlFeedback = false
      })
      EventBus.on('url changed', onURLChange)

      // --------------

      this.ui = new UI($scope, model)

      if (settings._ && settings._.isSettingsVisible) {
        $scope.ui.panel.isSidebarVisible = true
        $scope.ui.panel.main = settings._.mainWindow
      }

      this.setTheme = theme => {
        if (includes(theme, $scope.themes)) {
          $scope.theme = theme
        }
      }
      this.setLanguage = language => {
        if (has(language, $scope.languages)) {
          $scope.language = language
        }
      }

      EventBus.on('escape pressed', () => {
        if (
          this.ui.panel.isActive('scale-designer') &&
          document.activeElement.tagName.toLowerCase() === 'body'
        ) {
          this.ui.model._.selection.pitches.clear()
        }
      })

      EventBus.on('ctrl + a pressed', () => {
        if (
          this.ui.panel.isActive('scale-designer') &&
          document.activeElement.tagName.toLowerCase() === 'body' &&
          !isEmpty($scope.sets)
        ) {
          this.ui.model._.selection.pitches.clear()
          this.ui.model._.selection.pitches.add(range(0, $scope.sets.length))
        }
      })

      EventBus.on('delete pressed', () => {
        if (
          this.ui.panel.isActive('scale-designer') &&
          document.activeElement.tagName.toLowerCase() === 'body'
        ) {
          this.ui.model.deleteSelectedPitches()
        }
      })

      document.body.addEventListener(
        'keydown',
        e => {
          if (e.key === 'Shift' && $scope.system.shiftPressed === false) {
            $scope.system.shiftPressed = true
            safeApply($scope)
          }

          if (e.key === 'Escape' && $scope.system.escapePressed === false) {
            $scope.system.escapePressed = true
            safeApply($scope)
            EventBus.emit('escape pressed')
          }

          if (e.key === 'Delete' && $scope.system.deletePressed === false) {
            $scope.system.deletePressed = true
            safeApply($scope)
            EventBus.emit('delete pressed')
          }

          if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === 'a' || e.key === 'A') &&
            $scope.system.ctrlAPressed === false
          ) {
            $scope.system.ctrlAPressed = true
            safeApply($scope)
            EventBus.emit('ctrl + a pressed')
          }
        },
        true
      )

      document.body.addEventListener(
        'keyup',
        e => {
          if (e.key === 'Shift' && $scope.system.shiftPressed === true) {
            $scope.system.shiftPressed = false
            safeApply($scope)
          }

          if (e.key === 'Escape' && $scope.system.escapePressed === true) {
            $scope.system.escapePressed = false
            safeApply($scope)
          }

          if (e.key === 'Delete' && $scope.system.deletePressed === true) {
            $scope.system.deletePressed = false
            safeApply($scope)
          }

          if ((e.key === 'a' || e.key === 'A') && $scope.system.ctrlAPressed === true) {
            $scope.system.ctrlAPressed = false
            safeApply($scope)
          }
        },
        true
      )

      const wrapper = document.querySelector('.wrapper')
      watchForHover(wrapper)
      wrapper.classList.remove('loading')
    }
  ])

// ------------------

const container = document.getElementById('app')
if (container) {
  const settings = mergeDeepLeftAll(__INITIAL_DATA__, defaultDatas)
  delete window.__INITIAL_DATA__
  hydrate(<App data={settings} />, container)
}
