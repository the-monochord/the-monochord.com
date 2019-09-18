import { pathOr, propOr, forEach, addIndex } from 'ramda'

const indexedForEach = addIndex(forEach)

class Simple {
  constructor(ctx, options = {}) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = pathOr(20000, ['filter', 'lowpass'], options)

    const panner = ctx.createStereoPanner()
    panner.connect(ctx.destination)
    panner.pan.value = propOr(0, 'pan', options)

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(panner)

    const oscillator = ctx.createOscillator()
    oscillator.connect(gain)
    oscillator.type = propOr('triangle', 'waveType', options)
    oscillator.start()

    this._ = {
      ctx,
      nodes: {
        gain,
        oscillator,
        panner
      },
      events: []
    }
  }

  setLoopSize(loopSize) {
    this._.meta.loopSize = loopSize
  }

  clearEvents() {
    this._.events = []
  }

  schedule(eventData) {
    this._.events.push(eventData)
  }

  play(startTime) {
    const { nodes, events, ctx } = this._

    const attack = 0.01
    const release = 0.02

    const startFrom = startTime || ctx.currentTime

    indexedForEach(({ event, velocity, pitch, time }, idx) => {
      const t = startFrom + time
      switch (event) {
        case 'note on':
          nodes.gain.gain.cancelAndHoldAtTime(t)
          if (nodes.gain.gain.hasScheduledChanges()) {
          } else {
            const valueAtTime = nodes.gain.gain.getValueAtTime(t)
            nodes.gain.gain.setValueAtTime(valueAtTime, t)
          }
          nodes.gain.gain.linearRampToValueAtTime(velocity, t + attack)
          nodes.oscillator.frequency.setValueAtTime(pitch, t)
          break
        case 'note off':
          nodes.gain.gain.cancelAndHoldAtTime(t)
          if (nodes.gain.gain.hasScheduledChanges()) {
          } else {
            const valueAtTime = nodes.gain.gain.getValueAtTime(t)
            nodes.gain.gain.setValueAtTime(valueAtTime, t)
          }
          nodes.gain.gain.linearRampToValueAtTime(0, t + release)
          break
      }
    })(events)
  }

  pause(now) {
    const {
      nodes: { gain, oscillator }
    } = this._

    gain.gain.cancelAndHoldAtTime(now)
    gain.gain.linearRampToValueAtTime(0, now + 0.02)
    oscillator.frequency.cancelAndHoldAtTime(now)
  }
}

export default Simple
