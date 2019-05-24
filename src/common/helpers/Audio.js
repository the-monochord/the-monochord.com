import EventEmitter from 'eventemitter3'
import { reduce, append, forEach, has } from 'ramda'
import AudioFileManager from 'audio'
// import { rotateLeft, rotateRight } from './ramda'
import { roundToNDecimals } from './number'

const instruments = {}
const sequences = {}

const setSequence = (name, Transport, { sequence, instrument }) => {
  if (has(name, sequences)) {
    forEach(event => {
      Transport.clear(event)
    }, sequences[name].events)
  } else {
    sequences[name] = {
      events: []
    }
  }

  sequences[name].events = reduce((events, { pitch, duration = 1, startAt }) => {
    const event = Transport.schedule(time => {
      instruments[instrument].triggerAttackRelease(pitch, `${Math.round(16 / duration)}n`, time)
    }, startAt)
    return append(event, events)
  }, [])(sequence)
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
    { pitch: 'D5', startAt: `0:0:0` },
    { pitch: 'G4', startAt: `0:0:2` },
    { pitch: 'B4', duration: 2, startAt: `0:0:6` },
    { pitch: 'F#4', startAt: `0:0:12` },
    { pitch: 'B3', startAt: `0:0:14` },
    { pitch: 'E4', startAt: `0:0:18` },
    { pitch: 'A4', startAt: `0:0:20` },
    { pitch: 'F#4', startAt: `0:0:22` }
  ]

  setSequence('guitar1', Transport, {
    instrument: 'guitar1',
    sequence: sequence
  })

  /*
  setSequence('guitar2', Transport, {
    instrument: 'guitar2',
    sequence: rotateRight(2, sequence)
  })

  setSequence('guitar3', Transport, {
    instrument: 'guitar3',
    sequence: rotateLeft(3, sequence)
  })

  setSequence('guitar4', Transport, {
    instrument: 'guitar4',
    sequence: rotateRight(5, sequence)
  })
  */

  setSequence('bass1', Transport, {
    instrument: 'bass1',
    sequence: [
      { pitch: 'A1', startAt: `0:0:0` },
      { pitch: 'A2', startAt: `0:0:4` },
      { pitch: 'A1', startAt: `0:0:8` },
      { pitch: 'A2', startAt: `0:0:10` },
      { pitch: 'C2', startAt: `0:0:16` },
      { pitch: 'C3', startAt: `0:0:22` },
      { pitch: 'C2', startAt: `0:0:24` },
      { pitch: 'C3', startAt: `0:0:28` },
      { pitch: 'E1', startAt: `0:0:32` },
      { pitch: 'E2', startAt: `0:0:34` },
      { pitch: 'E1', startAt: `0:0:40` },
      { pitch: 'E2', startAt: `0:0:44` }
    ]
  })

  setSequence('bass2', Transport, {
    instrument: 'bass2',
    sequence: [
      { pitch: 'A1', startAt: `0:0:0` },
      { pitch: 'A2', startAt: `0:0:6` },
      { pitch: 'A1', startAt: `0:0:8` },
      { pitch: 'A2', startAt: `0:0:12` },
      { pitch: 'C2', startAt: `0:0:16` },
      { pitch: 'C3', startAt: `0:0:18` },
      { pitch: 'C2', startAt: `0:0:24` },
      { pitch: 'C3', startAt: `0:0:30` },
      { pitch: 'E1', startAt: `0:0:32` },
      { pitch: 'E2', startAt: `0:0:36` },
      { pitch: 'E1', startAt: `0:0:40` },
      { pitch: 'E2', startAt: `0:0:42` }
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
