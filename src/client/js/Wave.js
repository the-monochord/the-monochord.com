/* global fetch */

import { toPairs, forEach, compose, omit, map, adjust, keys, cond, T, propEq, update, curry } from 'ramda'

import { toDashCase } from './helpers'

const createWaveTable = (ctx, { real, imag }) =>
  ctx.createPeriodicWave(Float32Array.from(real), Float32Array.from(imag))

const setBasicWaveform = curry((type, oscillator) => {
  oscillator.type = type
})

const setWaveTable = curry((type, oscillator) => {
  oscillator.setPeriodicWave(waveTables[type])
})

const waveFactories = {
  sine: setBasicWaveform('sine'),
  triangle: setBasicWaveform('triangle'),
  square: setBasicWaveform('square'),
  sawtooth: setBasicWaveform('sawtooth')
}

const waveTables = {}

class Wave {
  constructor(ctx, staticPath) {
    this._ = {
      ctx,
      staticPath
    }

    this.fetchWaveTables()
  }

  async fetchWaveTables() {
    const { ctx, staticPath } = this._
    const response = await fetch(`${staticPath}/resources/wave-tables.json`)
    const data = await response.json()

    compose(
      forEach(([waveName, data]) => {
        waveTables[waveName] = createWaveTable(ctx, data)
        waveFactories[waveName] = setWaveTable(waveName)
      }),
      map(
        cond([
          [propEq(0, 'DynaEPBright'), update(0, 'dyna-ep-bright')],
          [propEq(0, 'DynaEPMed'), update(0, 'dyna-ep-med')],
          [propEq(0, 'TB303Square'), update(0, 'tb-303-square')],
          [T, adjust(0, toDashCase)]
        ])
      ),
      toPairs,
      omit(['Sine', 'Triangle', 'Square', 'Saw'])
    )(data)
  }

  setCtx(ctx) {
    this._.ctx = ctx
  }

  getTypes() {
    return keys(waveFactories)
  }

  createOscillator(type, frequency) {
    const { ctx } = this._
    const o = ctx.createOscillator()
    waveFactories[type](o)
    o.frequency.value = frequency
    return o
  }

  updateOscillator(o, type, frequency) {
    waveFactories[type](o)
    o.frequency.setValueAtTime(frequency, 0)
  }
}

export default Wave
