import { sort, subtract } from 'ramda'
import { angularToNormalJSON, safeApply, NOP } from './helpers'

import { toJson } from './converter/scala'

const types = {
  SCALA: 0x01,
  JSON: 0x02
}

class Converter {
  constructor($scope, model) {
    this._ = {
      $scope,
      model
    }
  }

  load(url, type, isText) {
    let ret = Promise.resolve({
      data: url
    })

    switch (type) {
      case types.SCALA:
        ret = ret.then(response => toJson(response.data))
        break
    }

    return ret
  }

  injectIntoModel(data, callback = NOP) {
    const { $scope, model } = this._

    $scope.retune.default = 'lowestToBaseFreq'
    $scope.name = data.description

    data.notes.forEach(note => {
      const set = model.sets.add()
      const type = note.type === 'ratio' ? 'strings' : 'cents'
      const min = sort(subtract, note.multipliers)[0]
      const allTheSame = !note.multipliers.some(multiplier => multiplier !== min)

      note.multipliers.forEach((multiplier, index, array) => {
        model[type].add(set, {
          multiplier: multiplier,
          muted: allTheSame ? index !== array.length - 1 : min === multiplier
        })
      })
    })

    safeApply($scope, callback)
  }

  extractFromModel() {
    const { $scope } = this._
    return JSON.stringify(angularToNormalJSON($scope))
  }
}

Converter.types = types

export default Converter
