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
    am.frequency.value = 547
    am.type = 'sine'

    const amGain = ctx.createGain()
    amGain.gain.value = 0

    const amLfo = ctx.createOscillator()
    amLfo.frequency.value = 1
    amLfo.type = 'triangle'

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
    this._.amGain = amGain
    this._.amLfoGain = amLfoGain

    this.emit('ready')
  }

  play() {
    const { gain, ctx, amGain, amLfoGain } = this._
    gain.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1)
    amGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1)
    amLfoGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amLfoGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1)
  }
  pause() {
    const { gain, ctx, amGain, amLfoGain } = this._
    gain.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    amGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    amLfoGain.gain.cancelAndHoldAtTime(ctx.currentTime)
    amLfoGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
  }
  stop() {}

  renderToWav(filename) {
    // AudioFileManager(buffer.get()).save(filename)
  }
}

export default Audio
