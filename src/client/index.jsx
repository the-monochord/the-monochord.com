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
  split,
  replace,
  reject,
  isEmpty,
  length,
  ifElse,
  always,
  pathOr,
  reduce,
  unapply,
  includes,
  has,
  map,
  join
} from 'ramda'
import React from 'react'
import { hydrate } from 'react-dom'
import { getParametersFromArgs, getLastElementId, kvPairsToArgs, escape } from '../common/listen'
import App from '../common/components/App'
import { sleep } from '../common/helpers/function'
import { prefixIfNotEmpty } from '../common/helpers'
import AudioModel from './js/AudioModel'
import Model from './js/Model'
import UI from './js/Ui'
import { getSEOData, setSEOData, generateUrlFromState } from './js/seo'
import { safeApply, NOP, watchForHover } from './js/helpers'
import PolySynth from './js/synth/gate-controllers/PolySynth'

import './scss/index.scss'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/mbo.css'

const parsePath = compose(
  reject(isEmpty),
  split('/'),
  replace(/^listen\//, ''),
  replace(/^\//, ''),
  replace(/\/$/, '')
)

const scopeToPath = (sets, waveform, props = {}) => {
  const url = ifElse(length, generateUrlFromState(waveform), always(''))(sets)
  return `${url}${prefixIfNotEmpty('/', kvPairsToArgs(props))}`
}

const pathToSEOData = compose(getSEOData, parsePath)

const updateSetsAndWaveform = async (
  $scope,
  model,
  { lastSetId, lastElementId, sets, waveform, onUpdate = NOP }
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
        shiftPressed: false
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

      let seo = pathToSEOData(location.pathname)

      const handleChange = () => {
        const propsToExport = {
          name: escape($scope.name),
          labels: join(
            '-',
            map(compose(escape, pathOr('', ['label', 'alphabetical'])), $scope.sets)
          )
        }

        const newSeo = pathToSEOData(scopeToPath($scope.sets, $scope.waveform, propsToExport))
        $scope.hashOfSet = JSON.stringify($scope.sets)

        if (newSeo.url !== seo.url) {
          setSEOData(newSeo)
          seo = newSeo
        }
      }
      $scope.$watch('sets', handleChange, true)
      $scope.$watch('waveform', handleChange)
      $scope.$watch('name', handleChange)

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

      window.addEventListener('popstate', () => {
        const newSeo = pathToSEOData(location.pathname)
        if (newSeo.url !== seo.url) {
          setSEOData(newSeo, false)
          seo = newSeo
          const { sets, waveform } = getParametersFromArgs(parsePath(location.pathname))

          updateSetsAndWaveform($scope, model, {
            lastSetId: length(sets),
            lastElementId: getLastElementId(),
            sets,
            waveform
          })
        }
      })

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

      document.body.addEventListener(
        'keydown',
        e => {
          if (e.key === 'Shift' && $scope.system.shiftPressed === false) {
            $scope.system.shiftPressed = true
            safeApply($scope)
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
