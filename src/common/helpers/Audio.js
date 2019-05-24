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
      duration: '1m', // TODO: calculate this from sequences
      parts: {},
      instruments: {},
      sequences: []
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
  }

  play() {
    const { Tone } = this._
    Tone.Transport.start()
  }

  pause() {
    const { Tone } = this._
    Tone.Transport.pause()
  }

  stop() {
    const { Tone } = this._
    Tone.Transport.stop()
  }

  calculateOffset([offset, barSize]) {
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

    instruments.bass1 = createBass({ pan: -0.7, gain: 0.8 })
    instruments.bass2 = createBass({ pan: 0.7, gain: 0.8 })
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
      // TODO: this is a possible bug
      if (key === 'loop' && value === 1) {
        part.loop = false
      } else {
        part[key] = value
      }
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
      this.scheduleSong()

      OfflineTransport.start()
    }, durationInSeconds).then(buffer => {
      AudioFileManager(buffer.get()).save(filename)

      // Tone is now back to the normal context, need to reset settings
      this.setTempo()
      this.loadInstruments()
      this.scheduleSong()
    })
  }

  scheduleSong() {
    const { sequences, Tone } = this._
    Tone.loop = false

    forEach(({ name, instrument, events, props, startTime }) => {
      this.setPart(
        name,
        instrument,
        events,
        props,
        Array.isArray(startTime) ? this.calculateOffset(startTime) : startTime
      )
    }, sequences)
  }

  setSequences(sequences) {
    this._.sequences = sequences
    this.setTempo()
    this.scheduleSong()
  }
}

export default Audio
