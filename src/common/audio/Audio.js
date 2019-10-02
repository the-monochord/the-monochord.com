/* global AudioContext */
import EventEmitter from 'eventemitter3'
import { parseTuning, retune, toHertz } from 'absolute-cent'
import { forEach, /* reduce, isNil, is, */ compose, values } from 'ramda'
import Simple from './instruments/Simple'
import { generateNEdo } from './helpers'
// import AudioFileManager from 'audio'

class Audio extends EventEmitter {
  constructor() {
    super()

    this._ = {
      instruments: {},
      inited: false,
      previousPlaybackStartTime: 0,
      tuningData: parseTuning({
        anchor: [0, 'C4'],
        pitches: generateNEdo(12)
      })
    }
  }

  isSupported() {
    return Object.prototype.hasOwnProperty.call(window, 'AudioContext')
  }

  setVolume(instrumentName, volume) {
    this._.instruments[instrumentName].setProperty('volume', volume)
  }

  setInstrument(instrumentName, volume) {
    const { instruments, ctx, inited } = this._
    if (instruments[instrumentName]) {
      instruments[instrumentName].clearEvents()
    }
    const newInstrument = new Simple({ waveType: 'sine', volume })
    if (inited) {
      newInstrument.setContext(ctx)
    }
    instruments[instrumentName] = newInstrument
  }

  setEvents(instrumentName, events) {
    const { inited, instruments, tuningData } = this._
    if (inited) {
      const instrument = instruments[instrumentName]

      if (instrument) {
        instrument.clearEvents()
        events.forEach(({ event, pitch, time, velocity }) => {
          instrument.schedule({
            event,
            pitch: toHertz(retune(pitch, tuningData)),
            time,
            velocity
          })
        })
      }
    }
  }

  async init() {
    // const ctx = new OfflineAudioContext(2, 44100 * 6, 44100)
    const ctx = new AudioContext()

    this._.ctx = ctx
    this._.inited = true

    forEach(instrument => {
      instrument.setContext(ctx)
    }, values(this._.instruments))

    this.emit('ready')
  }

  play(cursorAt = 0) {
    const { instruments, ctx } = this._
    const now = ctx.currentTime

    compose(
      forEach(instrument => {
        instrument.play(now, cursorAt)
      }),
      values
    )(instruments)

    this._.previousPlaybackStartTime = now - cursorAt
  }

  pause() {
    const { instruments, ctx, previousPlaybackStartTime } = this._
    const now = ctx.currentTime
    compose(
      forEach(instrument => {
        instrument.pause(now)
      }),
      values
    )(instruments)
    return now - previousPlaybackStartTime
  }

  cursorAt() {
    const { ctx, previousPlaybackStartTime } = this._
    const now = ctx.currentTime
    return now - previousPlaybackStartTime
  }

  renderToWav(filename) {
    /*
    const { ctx } = this._
    this.play()
    ctx.startRendering().then(buffer => {
      AudioFileManager(buffer).save(filename)
    })
    */
  }
}

export default Audio
