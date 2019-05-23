import EventEmitter from 'eventemitter3'
import { isNil, repeat, reduce, concat } from 'ramda'
import AudioFileManager from 'audio'
import { rotateLeft, rotateRight } from './ramda'
import { roundToNDecimals } from './number'

const instruments = {}

const setInstrument = (name, instrument) => {
  instruments[name] = instrument
}

const setSequence = (Tone, { sequence, instrument, repetition = 1 }) => {
  const notes = repetition > 1 ? reduce(concat, [], repeat(sequence, repetition)) : sequence

  reduce((counter, note) => {
    if (Array.isArray(note)) {
      if (!isNil(note[0])) {
        Tone.Transport.schedule(
          time => instruments[instrument].triggerAttackRelease(note[0], `${Math.round(16 / note[1])}n`, time),
          `0:0:${counter * 2}`
        )
      }
    } else {
      if (!isNil(note)) {
        Tone.Transport.schedule(
          time => instruments[instrument].triggerAttackRelease(note, '16n', time),
          `0:0:${counter * 2}`
        )
      }
    }
    return counter + (Array.isArray(note) ? note[1] : 1)
  }, 0)(notes)
}

const scheduleSong = (Tone, Transport, loop = false) => {
  setInstrument('guitar1', new Tone.Synth().chain(new Tone.Panner(-0.4), new Tone.Gain(0.5), Tone.Master))
  setInstrument('guitar2', new Tone.Synth().chain(new Tone.Panner(-0.1), new Tone.Gain(0.5), Tone.Master))
  setInstrument('guitar3', new Tone.Synth().chain(new Tone.Panner(0.1), new Tone.Gain(0.5), Tone.Master))
  setInstrument('guitar4', new Tone.Synth().chain(new Tone.Panner(0.4), new Tone.Gain(0.5), Tone.Master))

  setInstrument(
    'bass1',
    new Tone.Synth({ oscillator: { type: 'square' } }).chain(
      new Tone.Filter(700, 'lowpass'),
      new Tone.Panner(0.7),
      new Tone.Gain(0.8),
      Tone.Master
    )
  )

  setInstrument(
    'bass2',
    new Tone.Synth({ oscillator: { type: 'square' } }).chain(
      new Tone.Filter(700, 'lowpass'),
      new Tone.Panner(-0.7),
      new Tone.Gain(0.8),
      Tone.Master
    )
  )

  Transport.loop = loop

  const sequence = ['D5', 'G4', null, ['B4', 2], 'F#4', 'B3', null, 'E4', 'A4', 'F#4', null]

  setSequence(Tone, {
    instrument: 'guitar1',
    sequence: sequence,
    repetition: 2
  })

  setSequence(Tone, {
    instrument: 'guitar2',
    sequence: rotateRight(2, sequence),
    repetition: 2
  })

  setSequence(Tone, {
    instrument: 'guitar3',
    sequence: rotateLeft(3, sequence),
    repetition: 2
  })

  setSequence(Tone, {
    instrument: 'guitar4',
    sequence: rotateRight(5, sequence),
    repetition: 2
  })

  setSequence(Tone, {
    instrument: 'bass1',
    sequence: [
      'A1',
      null,
      'A2',
      null,
      'A1',
      'A2',
      [null, 2],
      'C2',
      [null, 2],
      'C3',
      'C2',
      null,
      'C3',
      null,
      'E1',
      'E2',
      [null, 2],
      'E1',
      null,
      'E2',
      null
    ]
  })

  setSequence(Tone, {
    instrument: 'bass2',
    sequence: [
      'A1',
      [null, 2],
      'A2',
      'A1',
      null,
      'A2',
      null,
      'C2',
      'C3',
      [null, 2],
      'C2',
      [null, 2],
      'C3',
      'E1',
      null,
      'E2',
      null,
      'E1',
      'E2',
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
  }

  play() {
    const { Tone } = this._
    this.setTempo()
    scheduleSong(Tone, Tone.Transport, true)
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

    this.setTempo()
    const durationInSeconds = roundToNDecimals(3, Tone.Transport.loopEnd)

    Tone.Offline(OfflineTransport => {
      this.setTempo(OfflineTransport)
      scheduleSong(Tone, OfflineTransport, false)
      OfflineTransport.start()
    }, durationInSeconds).then(buffer => {
      AudioFileManager(buffer.get()).save(filename)
    })
  }
}

export default Audio
