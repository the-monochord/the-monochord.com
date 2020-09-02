import { memoizeWith } from 'ramda'
import ModelUI from './ui/ModelUI'
import PanelUI from './ui/PanelUI'
import PianoUI from './ui/PianoUI'
import ScalaUI from './ui/ScalaUI'
import Model from './Model'
import { roundTo2Decimals } from './helpers'

class UI {
  constructor($scope, model) {
    $scope.ui = {
      mousedown: false
    }

    this.model = new ModelUI($scope, model)
    this.panel = new PanelUI($scope)
    this.piano = new PianoUI($scope, model)
    this.scala = new ScalaUI($scope, model)

    this.panel.on('change', what => {
      if (what === 'scala') {
        this.scala.refreshEditor()
      }
    })

    this.calculateStringFrequency = function (string) {
      return model.calculate.frequency(string, Model.TYPE.STRING)
    }
    this.calculateCentFrequency = function (cent) {
      return model.calculate.frequency(cent, Model.TYPE.CENT)
    }
    this.stringToCent = memoizeWith(JSON.stringify, string =>
      roundTo2Decimals(model.calculate.cent(string))
    )

    this.mouseDown = function () {
      $scope.ui.mousedown = true
    }
    this.mouseUp = function () {
      $scope.ui.mousedown = false
    }
  }
}

export default UI
