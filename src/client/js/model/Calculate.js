import monochord from 'monochord-core'
import Model from '../Model'

const {
  convert: { fractionToCents, centsToFraction, ratioToFraction },
  math: { subtract }
} = monochord

class Calculate {
  constructor(model, $scope) {
    this._ = {
      model,
      $scope
    }
  }

  baseFrequency(target, type) {
    const { model, $scope } = this._

    const set = Number.isInteger(target) ? model.sets.findById(target) : target
    if (set) {
      let method = set.retune
      if (method === 'inherit') {
        method = $scope.retune.default
      }
      if (!model.retune[method]) {
        method = 'off'
      }

      return model.retune[method](set, type)
    } else {
      return 0
    }
  }

  frequency(target, type) {
    const { model } = this._

    const id = Number.isInteger(target) ? target : target.id
    const isCentType = type === Model.TYPE.CENT

    let freq

    model[isCentType ? 'cents' : 'strings'].findById(id, (element, index, array, set) => {
      freq =
        this.baseFrequency(set, type) *
        (isCentType
          ? parseFloat(centsToFraction(element.multiplier).toString())
          : element.multiplier)
    })

    return freq
  }

  cent(target) {
    const { model } = this._

    const element = Number.isInteger(target) ? model.strings.findById(target) : target
    const set = model.sets.findByElement(element)

    if (set.strings.length > 1) {
      const baseFreq = this.baseFrequency(set, Model.TYPE.STRING)

      const centValue = fractionToCents(
        ratioToFraction(baseFreq, baseFreq * element.multiplier)
      ).toString()

      const lowestMultiplier = model.harmonics.getLowest(set, Model.TYPE.STRING)
      const lowestCentValue = fractionToCents(
        ratioToFraction(baseFreq, baseFreq * lowestMultiplier)
      ).toString()

      return parseFloat(subtract(centValue, lowestCentValue).toString())
    } else {
      return 0
    }
  }
}

export default Calculate
