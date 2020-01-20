import { memoizeWith } from 'ramda'
import ModelUI from './ui/ModelUI'
import PanelUI from './ui/PanelUI'
import PianoUI from './ui/PianoUI'
import ScalaUI from './ui/ScalaUI'
import TutorialUI from './ui/TutorialUI'
import Model from './Model'

class UI {
  constructor($scope, model) {
    $scope.ui = {
      mousedown: false
    }

    this.model = new ModelUI($scope, model)
    this.panel = new PanelUI($scope)
    this.piano = new PianoUI($scope, model)
    this.scala = new ScalaUI($scope, model)
    this.tutorial = new TutorialUI($scope)

    this.panel.on('change', what => {
      if (what === 'scala') {
        this.scala.refreshEditor()
      }
    })

    this.calculateStringFrequency = function(string) {
      return model.calculate.frequency(string, Model.TYPE.STRING)
    }
    this.calculateCentFrequency = function(cent) {
      return model.calculate.frequency(cent, Model.TYPE.CENT)
    }
    this.stringToCent = memoizeWith(JSON.stringify, string => Math.round(model.calculate.cent(string) * 100) / 100)

    this.mouseDown = function() {
      $scope.ui.mousedown = true
    }
    this.mouseUp = function() {
      $scope.ui.mousedown = false
    }
  }
}

export default UI
