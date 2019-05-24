import EventEmitter from 'eventemitter3'
import AudioFileManager from 'audio'
import { forEach, toPairs } from 'ramda'
import { roundToNDecimals } from './number'

class Audio extends EventEmitter {
  constructor() {
    super()
    this._ = {
      Tone: null,
      bpm: 192,
      timeSignature: [3, 2],
      duration: '2m',
      parts: {},
      instruments: {},
      sequences: {}
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

  calculateOffset(offset, barSize) {
    const { Tone } = this._
    const x = offset > 0 ? barSize - Math.abs(offset) : Math.abs(offset)
    return -Tone.Time(`0:0:${x * 2}`).toSeconds()
  }

  setTempo(Transport = this._.Tone.Transport) {
    const { bpm, timeSignature, duration } = this._
    Transport.bpm.value = bpm
    Transport.timeSignature = timeSignature
    Transport.loopEnd = duration
  }

  loadInstruments() {
    const { instruments, Tone } = this._

    const createGuitar = props => {
      const { pan, gain } = props
      return new Tone.Synth().chain(new Tone.Panner(pan), new Tone.Gain(gain), Tone.Master)
    }

    const createBass = props => {
      const { pan, gain } = props
      return new Tone.Synth({ oscillator: { type: 'square' } }).chain(
        new Tone.Filter(700, 'lowpass'),
        new Tone.Panner(pan),
        new Tone.Gain(gain),
        Tone.Master
      )
    }

    instruments.guitar1 = createGuitar({ pan: -0.4, gain: 0.5 })
    instruments.guitar2 = createGuitar({ pan: -0.1, gain: 0.5 })
    instruments.guitar3 = createGuitar({ pan: 0.1, gain: 0.5 })
    instruments.guitar4 = createGuitar({ pan: 0.4, gain: 0.5 })

    instruments.bass1 = createBass({ pan: 0.7, gain: 0.8 })
    instruments.bass2 = createBass({ pan: -0.7, gain: 0.8 })
  }

  setPart(name, instrument, events, props, startTime) {
    const { parts, Tone, instruments } = this._

    if (parts[name]) {
      parts[name].dispose()
    }

    const part = new Tone.Part((time, event) => {
      instruments[instrument].triggerAttackRelease(event.note, event.dur, time)
    }, events)

    forEach(([key, value]) => {
      part[key] = value
    }, toPairs(props))

    part.start(startTime)

    parts[name] = part
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
    // const { sequences } = this._
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

    const sequences = {
      guitar1: {
        instrument: 'guitar1',
        events: guitarSequence,
        props: { loop: 2, loopEnd: '1m' },
        startTime: 0
      },
      guitar2: {
        instrument: 'guitar2',
        events: guitarSequence,
        props: { loop: 2, loopEnd: '1m' },
        startTime: this.calculateOffset(2, 12)
      },
      guitar3: {
        instrument: 'guitar3',
        events: guitarSequence,
        props: { loop: 2, loopEnd: '1m' },
        startTime: this.calculateOffset(-3, 12)
      },
      guitar4: {
        instrument: 'guitar4',
        events: guitarSequence,
        props: { loop: 2, loopEnd: '1m' },
        startTime: this.calculateOffset(5, 12)
      },
      bass1: {
        instrument: 'bass1',
        events: bassSequence1,
        props: { loop: 1, loopEnd: '2m' },
        startTime: 0
      },
      bass2: {
        instrument: 'bass2',
        events: bassSequence2,
        props: { loop: 1, loopEnd: '2m' },
        startTime: 0
      }
    }

    forEach(([name, { instrument, events, props, startTime }]) => {
      this.setPart(name, instrument, events, props, startTime)
    }, toPairs(sequences))
  }
}

export default Audio
