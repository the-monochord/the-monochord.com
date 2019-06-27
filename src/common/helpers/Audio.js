/* global OfflineAudioContext */

import EventEmitter from 'eventemitter3'
import AudioFileManager from 'audio'
import { memoizeWith, modulo } from 'ramda'
import { roundToNDecimals } from './number'

const createWave = memoizeWith(
  phaseOffset => roundToNDecimals(2, modulo(phaseOffset, 1)),
  (phaseOffset, ctx) => {
    const real = new Float32Array(2)
    const imag = new Float32Array(2)
    const shift = 2 * Math.PI * roundToNDecimals(2, modulo(phaseOffset, 1))

    real[0] = 1
    real[1] = 0 * Math.cos(shift) - 1 * Math.sin(shift)
    imag[0] = 0
    imag[1] = 0 * Math.sin(shift) + 1 * Math.cos(shift)

    return ctx.createPeriodicWave(real, imag, { disableNormalization: true })
  }
)

class Audio extends EventEmitter {
  constructor() {
    super()

    this._ = {
      sequences: []
    }
  }
  isSupported() {
    return !!window.hasOwnProperty('AudioContext')
  }

  async init() {
    const ctx = new OfflineAudioContext(1, 44100 * 2, 44100)

    this._.ctx = ctx

    this.emit('ready')

    /*
    // AM/FM example

    const oscillator = ctx.createOscillator()
    oscillator.frequency.value = 400
    oscillator.type = 'triangle'

    const gain = ctx.createGain()
    gain.gain.value = 0

    const am = ctx.createOscillator()
    am.frequency.value = 117
    am.type = 'sine'

    const amGain = ctx.createGain()
    amGain.gain.value = 0

    const amLfo = ctx.createOscillator()
    amLfo.frequency.value = 30
    amLfo.type = 'sine'

    const amLfoGain = ctx.createGain()
    amLfoGain.gain.value = 0

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    am.connect(amGain)
    amGain.connect(gain.gain)
    amLfo.connect(amLfoGain)
    amLfoGain.connect(amGain.gain)

    oscillator.start()
    am.start()
    amLfo.start()

    // --------------

    this._.gain = gain
    this._.am = am
    this._.amGain = amGain
    this._.amLfo = amLfo
    this._.amLfoGain = amLfoGain
    */

    this._.createWave = createWave

    const wave1 = createWave(0, ctx)

    const oscillator1 = ctx.createOscillator()
    oscillator1.frequency.value = 400
    oscillator1.setPeriodicWave(wave1)

    const gain1 = ctx.createGain()
    gain1.gain.value = 0

    oscillator1.connect(gain1)
    gain1.connect(ctx.destination)
    oscillator1.start()

    this._.gain1 = gain1

    // ---------------

    const wave2 = createWave(0, ctx)

    const oscillator2 = ctx.createOscillator()
    oscillator2.frequency.value = 400
    oscillator2.setPeriodicWave(wave2)

    const gain2 = ctx.createGain()
    gain2.gain.value = 0

    oscillator2.connect(gain2)
    gain2.connect(ctx.destination)
    // oscillator2.start()

    this._.gain2 = gain2
    this._.oscillator2 = oscillator2
  }

  play() {
    /*
    // AM/FM example

    const { gain, ctx, am, amGain, amLfo, amLfoGain } = this._
    gain.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1)
    am.frequency.cancelAndHoldAtTime(ctx.currentTime)
    am.frequency.exponentialRampToValueAtTime(421, ctx.currentTime + 1.5)
    amGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1)
    amLfo.frequency.cancelAndHoldAtTime(ctx.currentTime)
    amLfo.frequency.exponentialRampToValueAtTime(5, ctx.currentTime + 1)
    amLfo.frequency.linearRampToValueAtTime(0.1, ctx.currentTime + 4)
    amLfoGain.gain.cancelAndHoldAtTime(ctx.currentTime + 1)
    amLfoGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.5)
    */

    const { gain1, gain2, ctx, createWave, oscillator2 } = this._

    ctx
      .startRendering()
      .then(buffer => {
        console.log('------------', buffer)
        AudioFileManager(buffer).save('phase-shift-demo.wav')
      })
      .catch(e => {
        console.error(e)
      })

    gain1.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1)
    gain2.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1)

    clearInterval(this._.interval)
    let offset = 0
    this._.interval = setInterval(() => {
      offset = roundToNDecimals(2, offset + 0.05)
      const wave = createWave(offset, ctx)
      oscillator2.setPeriodicWave(wave)
    }, 50)
  }
  pause() {
    /*
    // AM/FM example

    const { gain, ctx, am, amGain, amLfo, amLfoGain } = this._
    gain.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    am.frequency.cancelAndHoldAtTime(ctx.currentTime)
    am.frequency.linearRampToValueAtTime(117, ctx.currentTime + 1)
    amGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    amLfo.frequency.cancelAndHoldAtTime(ctx.currentTime)
    amLfo.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.5)
    amLfoGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amLfoGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    */

    const { gain1, gain2, ctx } = this._
    gain1.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    gain2.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)

    clearInterval(this._.interval)
  }
  stop() {}

  renderToWav(filename) {
    // AudioFileManager(buffer.get()).save(filename)
  }
}

export default Audio
