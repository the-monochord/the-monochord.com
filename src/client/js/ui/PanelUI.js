import EventEmitter from 'eventemitter3'
import AudioModel from '../AudioModel'
import * as stats from '../stats'

const defaultPage = 'scale-designer'

const isCompressedView = () => document.body.getBoundingClientRect().width < 1000

class PanelUI extends EventEmitter {
  constructor($scope) {
    super()

    this._ = {
      $scope
    }

    $scope.ui.panel = {
      main: defaultPage,
      isSidebarVisible: false
    }

    stats.onPageSelect(defaultPage)
  }

  toggle(what) {
    const { $scope } = this._

    if (what === 'settings') {
      $scope.ui.panel.isSidebarVisible = !$scope.ui.panel.isSidebarVisible
    } else {
      if (isCompressedView()) {
        $scope.ui.panel.isSidebarVisible = false
        $scope.ui.panel.main = what
      } else {
        $scope.ui.panel.main = what === $scope.ui.panel.main ? defaultPage : what
      }
      $scope.playbackMode = ['piano', 'midi-info'].includes($scope.ui.panel.main)
        ? AudioModel.MODES.PIANO
        : AudioModel.MODES.NORMAL
      this.emit('change', what)
      stats.onPageSelect($scope.ui.panel.main)
    }
  }

  isActive(what) {
    const { $scope } = this._

    if (what === 'settings') {
      return $scope.ui.panel.isSidebarVisible
    } else {
      return $scope.ui.panel.main === what
    }
  }
}

export default PanelUI
