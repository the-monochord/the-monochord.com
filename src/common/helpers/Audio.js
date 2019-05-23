import EventEmitter from 'eventemitter3'
import { isNil, repeat, reduce, concat } from 'ramda'
import AudioFileManager from 'audio'
import { rotateLeft, rotateRight } from './ramda'
import { roundToNDecimals } from './number'

const instruments = {}

const setSequence = (Transport, { sequence, instrument, repetition = 1 }) => {
  const notes = repetition > 1 ? reduce(concat, [], repeat(sequence, repetition)) : sequence

  reduce((counter, note) => {
    if (!isNil(note[0])) {
      Transport.schedule(
        time => instruments[instrument].triggerAttackRelease(note[0], `${Math.round(16 / note[1])}n`, time),
        `0:0:${counter * 2}`
      )
    }

    return counter + (Array.isArray(note) ? note[1] : 1)
  }, 0)(notes)
}

const loadInstruments = Tone => {
  instruments.guitar1 = new Tone.Synth().chain(new Tone.Panner(-0.4), new Tone.Gain(0.5), Tone.Master)
  instruments.guitar2 = new Tone.Synth().chain(new Tone.Panner(-0.1), new Tone.Gain(0.5), Tone.Master)
  instruments.guitar3 = new Tone.Synth().chain(new Tone.Panner(0.1), new Tone.Gain(0.5), Tone.Master)
  instruments.guitar4 = new Tone.Synth().chain(new Tone.Panner(0.4), new Tone.Gain(0.5), Tone.Master)

  instruments.bass1 = new Tone.Synth({ oscillator: { type: 'square' } }).chain(
    new Tone.Filter(700, 'lowpass'),
    new Tone.Panner(0.7),
    new Tone.Gain(0.8),
    Tone.Master
  )

  instruments.bass2 = new Tone.Synth({ oscillator: { type: 'square' } }).chain(
    new Tone.Filter(700, 'lowpass'),
    new Tone.Panner(-0.7),
    new Tone.Gain(0.8),
    Tone.Master
  )
}

const scheduleSong = (Transport, loop = false) => {
  Transport.loop = loop

  const sequence = [
    ['D5', 1],
    ['G4', 1],
    [null, 1],
    ['B4', 2],
    ['F#4', 1],
    ['B3', 1],
    [null, 1],
    ['E4', 1],
    ['A4', 1],
    ['F#4', 1],
    [null, 1]
  ]

  setSequence(Transport, {
    instrument: 'guitar1',
    sequence: sequence,
    repetition: 2
  })

  setSequence(Transport, {
    instrument: 'guitar2',
    sequence: rotateRight(2, sequence),
    repetition: 2
  })

  setSequence(Transport, {
    instrument: 'guitar3',
    sequence: rotateLeft(3, sequence),
    repetition: 2
  })

  setSequence(Transport, {
    instrument: 'guitar4',
    sequence: rotateRight(5, sequence),
    repetition: 2
  })

  setSequence(Transport, {
    instrument: 'bass1',
    sequence: [
      ['A1', 1],
      [null, 1],
      ['A2', 1],
      [null, 1],
      ['A1', 1],
      ['A2', 1],
      [null, 2],
      ['C2', 1],
      [null, 2],
      ['C3', 1],
      ['C2', 1],
      [null, 1],
      ['C3', 1],
      [null, 1],
      ['E1', 1],
      ['E2', 1],
      [null, 2],
      ['E1', 1],
      [null, 1],
      ['E2', 1],
      [null, 1]
    ]
  })

  setSequence(Transport, {
    instrument: 'bass2',
    sequence: [
      ['A1', 1],
      [null, 2],
      ['A2', 1],
      ['A1', 1],
      [null, 1],
      ['A2', 1],
      [null, 1],
      ['C2', 1],
      ['C3', 1],
      [null, 2],
      ['C2', 1],
      [null, 2],
      ['C3', 1],
      ['E1', 1],
      [null, 1],
      ['E2', 1],
      [null, 1],
      ['E1', 1],
      ['E2', 1],
      [null, 2]
    ]
  })
}

class Audio extends EventEmitter {
  constructor() {
    super()
    this._ = {
      Tone: null,
      bpm: 192,
      timeSignature: [3, 2],
      loopEnd: '2m'
    }
  }
  isSupported() {
    return !!window.hasOwnProperty('AudioContext')
  }

  async init() {
    const module = await import(/* webpackChunkName: "[tone]" */ 'tone')
    const Tone = module.default
    this._.Tone = Tone
    this.emit('ready')

    this.setTempo()
    loadInstruments(this._.Tone)
    scheduleSong(Tone.Transport, true)
  }

  play() {
    const { Tone } = this._
    Tone.Transport.start()
  }

  pause() {
    const { Tone } = this._
    Tone.Transport.pause()
  }

  setTempo(Transport = this._.Tone.Transport) {
    const { bpm, timeSignature, loopEnd } = this._
    Transport.bpm.value = bpm
    Transport.timeSignature = timeSignature
    Transport.loopEnd = loopEnd
  }

  renderToWav(filename) {
    const { Tone } = this._

    const durationInSeconds = roundToNDecimals(3, Tone.Transport.loopEnd)

    Tone.Offline(OfflineTransport => {
      // Tone now points to the offline context
      this.setTempo(OfflineTransport)
      loadInstruments(this._.Tone)
      scheduleSong(OfflineTransport, false)

      OfflineTransport.start()
    }, durationInSeconds).then(buffer => {
      AudioFileManager(buffer.get()).save(filename)

      // Tone is now back to the normal context, need to reset settings
      this.setTempo()
      loadInstruments(this._.Tone)
      scheduleSong(Tone.Transport, true)
    })
  }
}

export default Audio
