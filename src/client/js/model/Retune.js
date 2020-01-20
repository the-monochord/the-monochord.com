import monochord from 'monochord-core'
import Model from '../Model'

const {
  convert: { centsToFraction }
} = monochord

class Retune {
  constructor(model, $scope) {
    this._ = {
      model,
      $scope
    }
  }

  off() {
    const { $scope } = this._

    return $scope.baseFrequency
  }

  lowestToBaseFreq(target, type) {
    const { model, $scope } = this._

    let divisor = model.harmonics.getLowest(target, type)
    if (divisor === null) {
      return 0
    }
    if (type === Model.TYPE.CENT) {
      divisor = parseFloat(centsToFraction(divisor).toString())
    }
    if (divisor === 0) {
      return 0
    }
    return $scope.baseFrequency / divisor
  }

  highestToBaseFreq(target, type) {
    const { model, $scope } = this._

    let divisor = model.harmonics.getHighest(target, type)
    if (divisor === null) {
      return 0
    }
    if (type === Model.TYPE.CENT) {
      divisor = parseFloat(centsToFraction(divisor).toString())
    }
    if (divisor === 0) {
      return 0
    }
    return $scope.baseFrequency / divisor
  }

  lowestToPrevHighest(target, type) {
    const { model, $scope } = this._

    let to = $scope.baseFrequency

    const prevSet = model.sets.findPrevious(target)
    if (prevSet) {
      const divisor = model.harmonics.getHighest(prevSet, type)
      if (divisor !== null) {
        model.harmonics.findInSet(prevSet, divisor, (element, elementType) => {
          to = model.calculate.frequency(element, elementType)
        })
      }
    }

    let divisor = model.harmonics.getLowest(target, type)
    if (divisor === null) {
      return 0
    }
    if (type === Model.TYPE.CENT) {
      divisor = parseFloat(centsToFraction(divisor).toString())
    }
    if (divisor === 0) {
      return 0
    }

    return to / divisor
  }

  highestToPrevLowest(target, type) {
    const { model, $scope } = this._

    let to = $scope.baseFrequency

    const prevSet = model.sets.findPrevious(target)
    if (prevSet) {
      const divisor = model.harmonics.getLowest(prevSet, type)
      if (divisor !== null) {
        model.harmonics.findInSet(prevSet, divisor, (element, elementType) => {
          to = model.calculate.frequency(element, elementType)
        })
      }
    }

    let divisor = model.harmonics.getHighest(target, type)
    if (divisor === null) {
      return 0
    }
    if (type === Model.TYPE.CENT) {
      divisor = parseFloat(centsToFraction(divisor).toString())
    }
    if (divisor === 0) {
      return 0
    }

    return to / divisor
  }
}

export default Retune
