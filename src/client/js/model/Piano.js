class Piano {
  constructor($scope, audioModel, midi) {
    this._ = {
      $scope,
      audioModel,
      midi
    }

    $scope.$watch('playbackMode', value => {
      audioModel.setMode(value)
    })
  }

  getNotes() {
    const { audioModel } = this._

    return audioModel.getGateIds()
  }

  getFrequencies(rawId) {
    const { audioModel } = this._

    return audioModel.getPianoKeyFrequencies(rawId)
  }

  getCents(rawId) {
    const { audioModel } = this._

    return audioModel.getPianoKeyCents(rawId)
  }

  noteOn(elementId) {
    const { audioModel, midi } = this._

    midi.playFrequency(this.getFrequencies(elementId)[0])
    return audioModel.gateOn(elementId)
  }

  noteOff(elementId) {
    const { audioModel, midi } = this._

    midi.stopFrequency()
    audioModel.gateOff(elementId)
  }
}

export default Piano
