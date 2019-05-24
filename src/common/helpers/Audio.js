import EventEmitter from 'eventemitter3'
import AudioFileManager from 'audio'
import { forEach, toPairs } from 'ramda'
import { roundToNDecimals } from './number'

const calculateOffset = (Tone, offset, barSize) => {
  const x = offset > 0 ? barSize - Math.abs(offset) : Math.abs(offset)
  return -Tone.Time(`0:0:${x * 2}`).toSeconds()
}

class Audio extends EventEmitter {
  constructor() {
    super()
    this._ = {
      Tone: null,
      bpm: 192,
      timeSignature: [3, 2],
      duration: '2m',
      sequences: {},
      instruments: {}
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
    this.loadInstruments()
    this.scheduleSong(Tone.Transport, true)
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

  loadInstruments() {
    const { instruments, Tone } = this._
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

  setSequence(name, instrument, events, props, startTime) {
    const { sequences, Tone, instruments } = this._

    if (sequences[name]) {
      // clear
    }

    const sequence = new Tone.Part((time, event) => {
      instruments[instrument].triggerAttackRelease(event.note, event.dur, time)
    }, events)

    forEach(([key, value]) => {
      sequence[key] = value
    }, toPairs(props))

    sequence.start(startTime)

    sequences[name] = sequence
  }

  renderToWav(filename) {
    const { Tone } = this._

    const durationInSeconds = roundToNDecimals(3, Tone.Transport.loopEnd)

    Tone.Offline(OfflineTransport => {
      // Tone now points to the offline context
      this.setTempo(OfflineTransport)
      this.loadInstruments()
      this.scheduleSong(OfflineTransport, false)

      OfflineTransport.start()
    }, durationInSeconds).then(buffer => {
      AudioFileManager(buffer.get()).save(filename)

      // Tone is now back to the normal context, need to reset settings
      this.setTempo()
      this.loadInstruments()
      this.scheduleSong(Tone.Transport, true)
    })
  }

  scheduleSong(Transport, loop = false) {
    const { Tone } = this._
    Transport.loop = loop

    const guitarSequence = [
      { note: 'D5', dur: '16n', time: `0:0:0` },
      { note: 'G4', dur: '16n', time: `0:0:2` },
      { note: 'B4', dur: '8n', time: `0:0:6` },
      { note: 'F#4', dur: '16n', time: `0:0:12` },
      { note: 'B3', dur: '16n', time: `0:0:14` },
      { note: 'E4', dur: '16n', time: `0:0:18` },
      { note: 'A4', dur: '16n', time: `0:0:20` },
      { note: 'F#4', dur: '16n', time: `0:0:22` }
    ]

    const bassSequence1 = [
      { note: 'A1', dur: '16n', time: `0:0:0` },
      { note: 'A2', dur: '16n', time: `0:0:4` },
      { note: 'A1', dur: '16n', time: `0:0:8` },
      { note: 'A2', dur: '16n', time: `0:0:10` },
      { note: 'C2', dur: '16n', time: `0:0:16` },
      { note: 'C3', dur: '16n', time: `0:0:22` },
      { note: 'C2', dur: '16n', time: `0:0:24` },
      { note: 'C3', dur: '16n', time: `0:0:28` },
      { note: 'E1', dur: '16n', time: `0:0:32` },
      { note: 'E2', dur: '16n', time: `0:0:34` },
      { note: 'E1', dur: '16n', time: `0:0:40` },
      { note: 'E2', dur: '16n', time: `0:0:44` }
    ]

    const bassSequence2 = [
      { note: 'A1', dur: '16n', time: `0:0:0` },
      { note: 'A2', dur: '16n', time: `0:0:6` },
      { note: 'A1', dur: '16n', time: `0:0:8` },
      { note: 'A2', dur: '16n', time: `0:0:12` },
      { note: 'C2', dur: '16n', time: `0:0:16` },
      { note: 'C3', dur: '16n', time: `0:0:18` },
      { note: 'C2', dur: '16n', time: `0:0:24` },
      { note: 'C3', dur: '16n', time: `0:0:30` },
      { note: 'E1', dur: '16n', time: `0:0:32` },
      { note: 'E2', dur: '16n', time: `0:0:36` },
      { note: 'E1', dur: '16n', time: `0:0:40` },
      { note: 'E2', dur: '16n', time: `0:0:42` }
    ]

    this.setSequence('guitar1', 'guitar1', guitarSequence, { loop: 2, loopEnd: '1m' }, 0)
    this.setSequence('guitar2', 'guitar2', guitarSequence, { loop: 2, loopEnd: '1m' }, calculateOffset(Tone, 2, 12))
    this.setSequence('guitar3', 'guitar3', guitarSequence, { loop: 2, loopEnd: '1m' }, calculateOffset(Tone, -3, 12))
    this.setSequence('guitar4', 'guitar4', guitarSequence, { loop: 2, loopEnd: '1m' }, calculateOffset(Tone, 5, 12))
    this.setSequence('bass1', 'bass1', bassSequence1, { loop: 1, loopEnd: '2m' }, 0)
    this.setSequence('bass2', 'bass2', bassSequence2, { loop: 1, loopEnd: '2m' }, 0)
  }
}

export default Audio
