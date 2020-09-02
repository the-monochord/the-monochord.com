import { map, compose, objOf, assoc, mergeDeepRight } from 'ramda'
import AbstractTimbre from '../AbstractTimbre'
import { sound, change } from './helpers'

// const envelope = {
//   steps: [
//     { duration: 1, volume: 1 },
//     { duration: 10, volume: 0.6 },
//     { duration: 1, volume: 0.6 },
//     { duration: 20, volume: 0 }
//   ],
//   sustainIdx: 3 // marks, which step is the sustain; starting from 1 to match length
// }

class Subtractive extends AbstractTimbre {
  constructor(ctx, wave) {
    super(ctx)
    this._ = mergeDeepRight(this._, {
      wave,
      frequencies: [],
      settings: {
        mainVolume: 1
      }
    })
  }

  _render() {
    console.log('re-rendering:', this._.frequencies, this._.settings)
    change(sound(this._.frequencies, this._.settings, this._.wave), this._.ctx)
  }

  update(settings) {
    this._.settings = settings

    this._render()
  }

  reset() {
    this._.frequencies = []

    this._render()
  }

  noteOn(frequencies) {
    this._.frequencies = map(
      compose(assoc('volumes', [{ duration: 1, volume: 1 }]), objOf('frequency'))
    )(frequencies)

    this._render()
  }

  noteOff(frequencies) {
    this._.frequencies = map(
      compose(assoc('volumes', [{ duration: 20, volume: 0 }]), objOf('frequency'))
    )(frequencies)

    this._render()
  }
}

export default Subtractive
