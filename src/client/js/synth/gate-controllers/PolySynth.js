import { isEmpty, sort, compose, reduce, __, takeLast, concat, max, min } from 'ramda'
import { arrayReplace, arraySizeClamp, arrayRemoveExact, arrayPadRight } from '../../helpers'

const prioritize = (priority, pitches) => {
  if (priority === PolySynth.NOTE_PRIORITY.LAST) {
    return pitches
  } else if (priority === PolySynth.NOTE_PRIORITY.HIGH) {
    return sort((a, b) => a - b, pitches)
  } else if (priority === PolySynth.NOTE_PRIORITY.LOW) {
    return sort((a, b) => b - a, pitches)
  }
}

class PolySynth {
  constructor(timbre) {
    this._ = {
      timbre,
      pressedNotes: [],
      lastPressedNotes: [],
      lastPrioritizedNotes: [],
      voices: 2,
      previousVoicePool: [],
      notePriority: PolySynth.NOTE_PRIORITY.LAST
    }
  }

  update(settings) {
    this._.voices = settings.voices
    this._.notePriority = settings.notePriority

    this._noteDiff()
  }

  enable() {
    // this is a dummy function, don't know if anything needs to be done here at the moment
  }

  disable() {
    this._.pressedNotes = []
    this._.lastPressedNotes = []
    this._.previousVoicePool = []
    this._.timbre.reset()
  }

  _noteDiff() {
    const {
      pressedNotes,
      voices,
      notePriority,
      previousVoicePool,
      timbre,
      lastPrioritizedNotes
    } = this._

    const prioritizedNotes = takeLast(voices, prioritize(notePriority, pressedNotes))

    const size = max(voices, lastPrioritizedNotes.length)
    const prev = arrayPadRight(size, null, lastPrioritizedNotes)
    const next = arrayPadRight(size, null, prioritizedNotes)

    const notesToAdd = arrayRemoveExact(prev, next)
    const notesToRemove = arrayRemoveExact(next, prev)

    const voicePool = compose(
      reduce((arr, x) => arrayReplace(null, x, arr), __, notesToAdd),
      reduce((arr, x) => arrayReplace(x, null, arr), __, notesToRemove),
      arraySizeClamp(min(voices, size), max(voices, size), null)
    )(previousVoicePool)

    // TODO: remove duplicates from voicePool at this point by setting all but one of them to null

    timbre.updateVoicePool(voicePool)

    this._.previousVoicePool = voicePool
    this._.lastPrioritizedNotes = prioritizedNotes
  }

  noteOn(frequencies) {
    if (!isEmpty(frequencies)) {
      this._.pressedNotes = concat(this._.pressedNotes, frequencies)
      this._noteDiff()
    }
  }

  noteOff(frequencies) {
    if (!isEmpty(frequencies)) {
      this._.pressedNotes = arrayRemoveExact(frequencies, this._.pressedNotes)
      this._noteDiff()
    }
  }
}

PolySynth.NOTE_PRIORITY = {
  HIGH: 'high',
  LAST: 'last',
  LOW: 'low'
}

export default PolySynth
