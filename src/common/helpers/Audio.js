/* global AudioContext */

import EventEmitter from 'eventemitter3'
// import AudioFileManager from 'audio'

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
    const ctx = new AudioContext()

    // --------------

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

    this._.ctx = ctx
    this._.gain = gain
    this._.am = am
    this._.amGain = amGain
    this._.amLfo = amLfo
    this._.amLfoGain = amLfoGain

    this.emit('ready')
  }

  play() {
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
  }
  pause() {
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
  }
  stop() {}

  renderToWav(filename) {
    // AudioFileManager(buffer.get()).save(filename)
  }
}

export default Audio
