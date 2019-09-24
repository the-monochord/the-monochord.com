import { pathOr, propOr, forEach } from 'ramda'

const properCancelAndHold = (node, time) => {
  if (node.hasScheduledChangesAtTime(time)) {
    node.cancelAndHoldAtTime(time)
  } else {
    const valueAtTime = node.getValueAtTime(time)
    node.setValueAtTime(valueAtTime, time)
  }
}

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

  play(now, cursorAt) {
    const { nodes, events, ctx } = this._

    const attack = 0.1
    const release = 0.3

    const startFrom = now || ctx.currentTime

    forEach(({ event, velocity, pitch, time }) => {
      const t = startFrom + time
      switch (event) {
        case 'note on':
          {
            const gain = nodes.gain.gain
            const frequency = nodes.oscillator.frequency
            properCancelAndHold(gain, t)
            gain.linearRampToValueAtTime(velocity, t + attack)
            frequency.setValueAtTime(pitch, t)
          }
          break
        case 'note off':
          {
            const gain = nodes.gain.gain
            properCancelAndHold(gain, t)
            gain.linearRampToValueAtTime(0, t + release)
          }
          break
      }
    })(events)

    if (cursorAt > 0) {
      const gain = nodes.gain.gain
      const gainAtCursor = gain.getValueAtTime(startFrom + cursorAt)
      gain.cancelScheduledValues(startFrom)
      gain.setValueAtTime(gainAtCursor, startFrom)

      const frequency = nodes.oscillator.frequency
      const frequencyAtCursor = frequency.getValueAtTime(startFrom + cursorAt)
      frequency.cancelScheduledValues(startFrom)
      frequency.setValueAtTime(frequencyAtCursor, startFrom)
    }
  }

  pause(now) {
    const {
      nodes: { gain, oscillator }
    } = this._

    // TODO: why is the audio clicking here?
    properCancelAndHold(gain.gain, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.01)
    oscillator.frequency.cancelAndHoldAtTime(now)
  }
}

export default Simple
