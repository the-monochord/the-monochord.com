/* global AudioContext */

import EventEmitter from 'eventemitter3'
import { parseTuning, retune, toHertz, fromScientificNotation } from 'absolute-cent'
import { forEach, reduce, isNil, is, compose, values } from 'ramda'
// import AudioFileManager from 'audio'
/*
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
*/

// ---------------------------

const generateNEdo = n => {
  const pitches = []

  for (let i = 0; i <= 1200; i += 1200 / n) {
    pitches.push(i)
  }

  return pitches
}

const tuningData = parseTuning({
  anchor: [0, 'C4'],
  pitches: generateNEdo(5)
})

class Instrument {
  constructor(ctx) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)

    const oscillator = ctx.createOscillator()
    oscillator.connect(gain)
    oscillator.type = 'triangle'
    oscillator.start()

    this._ = {
      ctx,
      nodes: {
        gain,
        oscillator
      },
      events: []
    }
  }

  schedule(eventData) {
    this._.events.push(eventData)
  }

  play() {
    const { ctx, nodes, events } = this._

    const attack = 0.01
    const release = 0.03

    const sequenceLength = 12 * 0.15
    const sequenceRepeats = 3
    const startOffset = 0.5

    const startFrom = ctx.currentTime + startOffset

    for (let i = 0; i < sequenceRepeats; i++) {
      forEach(({ event, velocity, pitch, time }) => {
        const repeatOffset = sequenceLength * i
        const t = startFrom + time + repeatOffset
        switch (event) {
          case 'note on':
            nodes.gain.gain.cancelScheduledValues(t)
            nodes.gain.gain.setValueAtTime(0, t)
            nodes.gain.gain.linearRampToValueAtTime(velocity, t + attack)
            nodes.oscillator.frequency.setValueAtTime(toHertz(retune(pitch, tuningData)), t)
            break
          case 'note off':
            nodes.gain.gain.cancelAndHoldAtTime(t)
            nodes.gain.gain.linearRampToValueAtTime(0, t + release)
            break
        }
      })(events)
    }
  }

  pause() {
    const { nodes, ctx } = this._

    const now = ctx.currentTime

    nodes.gain.gain.cancelScheduledValues(now)
    nodes.gain.gain.setValueAtTime(0, now)
    nodes.oscillator.frequency.cancelScheduledValues(now)
  }
}

// ---------------------------

class Audio extends EventEmitter {
  constructor() {
    super()

    this._ = {
      instruments: {}
    }
  }

  isSupported() {
    return window.hasOwnProperty('AudioContext')
  }

  async init() {
    const ctx = new AudioContext()

    this._.ctx = ctx

    this.emit('ready')

    // --------------------------------

    this._.instruments['guitar #1'] = new Instrument(ctx)
    this._.instruments['guitar #2'] = new Instrument(ctx)
    this._.instruments['guitar #3'] = new Instrument(ctx)
    this._.instruments['guitar #4'] = new Instrument(ctx)

    const addNote = (instrument, note, time) => {
      const tempo = 0.15
      const noteLength = 0.1
      const [pitch, length] = is(String, note) ? [note, 1] : note

      instrument.schedule({
        event: 'note on',
        pitch: fromScientificNotation(pitch),
        time: time * tempo,
        velocity: 0.1
      })
      instrument.schedule({
        event: 'note off',
        pitch: fromScientificNotation(pitch),
        time: time * tempo + noteLength * length
      })
    }

    const addSequence = (instrument, notes) => {
      reduce(
        (cntr, note) => {
          if (isNil(note)) {
            return cntr + 1
          } else {
            addNote(instrument, note, cntr)
            return cntr + (is(String, note) ? 1 : note[1])
          }
        },
        0,
        notes
      )
    }

    addSequence(this._.instruments['guitar #1'], [
      'D5',
      'G4',
      null,
      ['B4', 2],
      'F#4',
      'B3',
      null,
      'E4',
      'A4',
      'F#4',
      null
    ])
    addSequence(this._.instruments['guitar #2'], [
      'F#4',
      null,
      'D5',
      'G4',
      null,
      ['B4', 2],
      'F#4',
      'B3',
      null,
      'E4',
      'A4'
    ])
    addSequence(this._.instruments['guitar #3'], [
      ['B4', 2],
      'F#4',
      'B3',
      null,
      'E4',
      'A4',
      'F#4',
      null,
      'D5',
      'G4',
      null
    ])
    addSequence(this._.instruments['guitar #4'], [
      null,
      'E4',
      'A4',
      'F#4',
      null,
      'D5',
      'G4',
      null,
      ['B4', 2],
      'F#4',
      'B3'
    ])

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

    /*
    const gain1 = ctx.createGain()
    gain1.gain.value = 0

    // oscillator1.connect(gain1)
    gain1.connect(ctx.destination)
    // oscillator1.start()

    this._.gain1 = gain1
    */

    // ---------------
    /*

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
    */
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
    /*
    const { gain1, gain2, ctx, createWave, oscillator2 } = this._

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
    */

    const { instruments } = this._

    compose(
      forEach(instrument => {
        instrument.play()
      }),
      values
    )(instruments)
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
    /*
    const { gain1, gain2, ctx } = this._
    gain1.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    gain2.gain.cancelAndHoldAtTime(ctx.currentTime)
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)

    clearInterval(this._.interval)
    */

    const { instruments } = this._
    compose(
      forEach(instrument => {
        instrument.pause()
      }),
      values
    )(instruments)
  }

  stop() {}

  renderToWav(filename) {
    // AudioFileManager(buffer.get()).save(filename)
  }
}

export default Audio
