import EventEmitter from 'eventemitter3'
import { isNil, repeat, reduce, concat } from 'ramda'
import AudioFileManager from 'audio'
import { rotateLeft, rotateRight } from './ramda'
import { roundToNDecimals } from './number'

const instruments = {}

const setSequence = (Transport, { sequence, instrument, repetition = 1 }) => {
  const notes = repetition > 1 ? reduce(concat, [], repeat(sequence, repetition)) : sequence

  reduce((counter, { pitch, duration = 1, startAt = `0:0:${counter * 2}` }) => {
    if (!isNil(pitch)) {
      Transport.schedule(
        time => instruments[instrument].triggerAttackRelease(pitch, `${Math.round(16 / duration)}n`, time),
        startAt
      )
    }

    return counter + duration
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
    { pitch: 'D5' },
    { pitch: 'G4' },
    { pitch: null },
    { pitch: 'B4', duration: 2 },
    { pitch: 'F#4' },
    { pitch: 'B3' },
    { pitch: null },
    { pitch: 'E4' },
    { pitch: 'A4' },
    { pitch: 'F#4' },
    { pitch: null }
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
      { pitch: 'A1' },
      { pitch: null },
      { pitch: 'A2' },
      { pitch: null },
      { pitch: 'A1' },
      { pitch: 'A2' },
      { pitch: null, duration: 2 },
      { pitch: 'C2' },
      { pitch: null, duration: 2 },
      { pitch: 'C3' },
      { pitch: 'C2' },
      { pitch: null },
      { pitch: 'C3' },
      { pitch: null },
      { pitch: 'E1' },
      { pitch: 'E2' },
      { pitch: null, duration: 2 },
      { pitch: 'E1' },
      { pitch: null },
      { pitch: 'E2' },
      { pitch: null }
    ]
  })

  setSequence(Transport, {
    instrument: 'bass2',
    sequence: [
      { pitch: 'A1' },
      { pitch: null, duration: 2 },
      { pitch: 'A2' },
      { pitch: 'A1' },
      { pitch: null },
      { pitch: 'A2' },
      { pitch: null },
      { pitch: 'C2' },
      { pitch: 'C3' },
      { pitch: null, duration: 2 },
      { pitch: 'C2' },
      { pitch: null, duration: 2 },
      { pitch: 'C3' },
      { pitch: 'E1' },
      { pitch: null },
      { pitch: 'E2' },
      { pitch: null },
      { pitch: 'E1' },
      { pitch: 'E2' },
      { pitch: null, duration: 2 }
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
