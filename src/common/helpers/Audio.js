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

  sequences[name].events = reduce((events, { note, dur = 1, startAt }) => {
    const event = Transport.schedule(time => {
      instruments[instrument].triggerAttackRelease(note, `${Math.round(16 / dur)}n`, time)
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

const calculateOffset = (Tone, offset, barSize) => {
  const x = offset > 0 ? barSize - Math.abs(offset) : Math.abs(offset)
  return -Tone.Time(`0:0:${x * 2}`).toSeconds()
}

const scheduleSong = (Tone, Transport, loop = false) => {
  Transport.loop = loop

  const sequence = [
    { note: 'D5', dur: '16n', time: `0:0:0` },
    { note: 'G4', dur: '16n', time: `0:0:2` },
    { note: 'B4', dur: '8n', time: `0:0:6` },
    { note: 'F#4', dur: '16n', time: `0:0:12` },
    { note: 'B3', dur: '16n', time: `0:0:14` },
    { note: 'E4', dur: '16n', time: `0:0:18` },
    { note: 'A4', dur: '16n', time: `0:0:20` },
    { note: 'F#4', dur: '16n', time: `0:0:22` }
  ]

  const guitar1 = new Tone.Part((time, event) => {
    instruments.guitar1.triggerAttackRelease(event.note, event.dur, time)
  }, sequence)

  guitar1.loop = 2
  guitar1.loopEnd = '1m'
  guitar1.start(0)

  const guitar2 = new Tone.Part((time, event) => {
    instruments.guitar2.triggerAttackRelease(event.note, event.dur, time)
  }, sequence)

  guitar2.loop = 2
  guitar2.loopEnd = '1m'
  guitar2.start(calculateOffset(Tone, 2, 12)) // rotate right 2

  const guitar3 = new Tone.Part((time, event) => {
    instruments.guitar3.triggerAttackRelease(event.note, event.dur, time)
  }, sequence)

  guitar3.loop = 2
  guitar3.loopEnd = '1m'
  guitar3.start(calculateOffset(Tone, -3, 12)) // rotate left 3

  const guitar4 = new Tone.Part((time, event) => {
    instruments.guitar4.triggerAttackRelease(event.note, event.dur, time)
  }, sequence)

  guitar4.loop = 2
  guitar4.loopEnd = '1m'
  guitar4.start(calculateOffset(Tone, 5, 12)) // rotate right 5

  setSequence('bass1', Transport, {
    instrument: 'bass1',
    sequence: [
      { note: 'A1', startAt: `0:0:0` },
      { note: 'A2', startAt: `0:0:4` },
      { note: 'A1', startAt: `0:0:8` },
      { note: 'A2', startAt: `0:0:10` },
      { note: 'C2', startAt: `0:0:16` },
      { note: 'C3', startAt: `0:0:22` },
      { note: 'C2', startAt: `0:0:24` },
      { note: 'C3', startAt: `0:0:28` },
      { note: 'E1', startAt: `0:0:32` },
      { note: 'E2', startAt: `0:0:34` },
      { note: 'E1', startAt: `0:0:40` },
      { note: 'E2', startAt: `0:0:44` }
    ]
  })

  setSequence('bass2', Transport, {
    instrument: 'bass2',
    sequence: [
      { note: 'A1', startAt: `0:0:0` },
      { note: 'A2', startAt: `0:0:6` },
      { note: 'A1', startAt: `0:0:8` },
      { note: 'A2', startAt: `0:0:12` },
      { note: 'C2', startAt: `0:0:16` },
      { note: 'C3', startAt: `0:0:18` },
      { note: 'C2', startAt: `0:0:24` },
      { note: 'C3', startAt: `0:0:30` },
      { note: 'E1', startAt: `0:0:32` },
      { note: 'E2', startAt: `0:0:36` },
      { note: 'E1', startAt: `0:0:40` },
      { note: 'E2', startAt: `0:0:42` }
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
      duration: '2m'
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
    scheduleSong(Tone, Tone.Transport, true)
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
    const { bpm, timeSignature, duration } = this._
    Transport.bpm.value = bpm
    Transport.timeSignature = timeSignature
    Transport.loopEnd = duration
  }

  renderToWav(filename) {
    const { Tone } = this._

    const durationInSeconds = roundToNDecimals(3, Tone.Transport.loopEnd)

    Tone.Offline(OfflineTransport => {
      // Tone now points to the offline context
      this.setTempo(OfflineTransport)
      loadInstruments(this._.Tone)
      scheduleSong(Tone, OfflineTransport, false)

      OfflineTransport.start()
    }, durationInSeconds).then(buffer => {
      AudioFileManager(buffer.get()).save(filename)

      // Tone is now back to the normal context, need to reset settings
      this.setTempo()
      loadInstruments(this._.Tone)
      scheduleSong(Tone, Tone.Transport, true)
    })
  }
}

export default Audio
