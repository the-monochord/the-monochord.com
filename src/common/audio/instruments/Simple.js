import { pathOr, propOr, forEach, compose, sort, prop, last, __, lt, isNil, filter, gte } from 'ramda'

const attack = 0.1
const release = 0.3

const properCancelAndHold = (node, time) => {
  if (node.hasScheduledChangesAtTime(time)) {
    node.cancelAndHoldAtTime(time)
  } else {
    const valueAtTime = node.getValueAtTime(time)
    node.setValueAtTime(valueAtTime, time)
  }
}

const getLastEvent = events => {
  return compose(
    last,
    sort(prop('time'))
  )(events)
}

const calculateTimeToReachSilence = event => {
  switch (event.event) {
    case 'note on':
      return Infinity
    case 'note off':
      return event.time + release
    default:
      return 0
  }
}

const getEventAtTime = (events, time) => {
  return compose(
    last,
    sort(prop('time')),
    filter(
      compose(
        lt(__, time),
        prop('time')
      )
    )
  )(events)
}

const filterEventsAtOrAfterTime = (events, time) => {
  return filter(
    compose(
      gte(__, time),
      prop('time')
    )
  )(events)
}

/*
options: {
  volume: 0 .. 1,
  waveType: 'sine' | 'triangle' | 'square' | 'sawtooth',
  filter: {
    lowpass: 20000
  },
  pan: -1 .. 1
}
*/

class Simple {
  constructor(options = {}) {
    this._ = {
      nodes: {},
      events: [],
      options,
      ctx: null
    }
  }

  generateNodes() {
    const { ctx, options } = this._

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

    // TODO: if this._.nodes is not empty (probably by accidentally calling generateNodes multiple times), then cleanup
    this._.nodes = {
      gain,
      oscillator,
      panner
    }
  }

  setContext(ctx) {
    this._.ctx = ctx
    this.generateNodes()
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

  invokeEvents(events, startFrom, correction) {
    const {
      nodes,
      options: { volume }
    } = this._

    forEach(({ event, velocity, pitch, time }) => {
      const t = startFrom + time + correction
      switch (event) {
        case 'note on':
          {
            const gain = nodes.gain.gain
            const frequency = nodes.oscillator.frequency
            properCancelAndHold(gain, t)
            gain.linearRampToValueAtTime(velocity * volume, t + attack)
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
  }

  play(now, cursorAt) {
    const {
      nodes,
      options: { volume },
      events,
      ctx
    } = this._

    const startFrom = now || ctx.currentTime

    if (cursorAt > 0) {
      const gain = nodes.gain.gain
      const frequency = nodes.oscillator.frequency

      // gain.setValueAtTime(0, startFrom)
      // frequency.setValueAtTime(0, startFrom)

      const timeToReachSilence = calculateTimeToReachSilence(getLastEvent(events))
      if (timeToReachSilence > cursorAt) {
        const slicedEvent = getEventAtTime(events, cursorAt)
        if (!isNil(slicedEvent)) {
          const t = slicedEvent.time - cursorAt
          if (slicedEvent.event === 'note on') {
            if (t > 0 && t < attack) {
              gain.linearRampToValueAtTime(slicedEvent.velocity * volume, startFrom + t + attack)
            } else {
              gain.setValueAtTime(slicedEvent.velocity * volume, startFrom)
            }
            frequency.setValueAtTime(slicedEvent.pitch, startFrom)
          } else if (slicedEvent.event === 'note off') {
            if (t > 0 && t < attack) {
              gain.linearRampToValueAtTime(0, t + release)
            } else {
              gain.setValueAtTime(0, startFrom)
            }
          }
        }

        const eventsAtOrAfterCursor = filterEventsAtOrAfterTime(events, cursorAt)
        this.invokeEvents(eventsAtOrAfterCursor, startFrom, -cursorAt)
      }
    } else {
      this.invokeEvents(events, startFrom, 0)
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

  setOption(property, value) {
    this._.options[property] = value
    // TODO: if isPlaying -> adjust audio
  }
}

export default Simple
