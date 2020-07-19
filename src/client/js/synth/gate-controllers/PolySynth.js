import { append, without, head, equals, takeLast, isEmpty, sort } from 'ramda'

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
      voices: 2,
      notePriority: PolySynth.NOTE_PRIORITY.LAST
    }
  }

  update(settings) {
    this._.voices = settings.voices
    this._.notePriority = settings.notePriority
  }

  enable() {
    // this is a dummy function for now, don't know if anything needs to be done here at the moment
  }

  disable() {
    this._.pressedNotes = []
    this._.lastPressedNotes = []
    this._.timbre.reset()
  }

  _noteDiff() {
    const lastActiveNotes = takeLast(
      this._.voices,
      prioritize(this._.notePriority, this._.lastPressedNotes)
    )
    const activeNotes = takeLast(
      this._.voices,
      prioritize(this._.notePriority, this._.pressedNotes)
    )

    if (!equals(lastActiveNotes, activeNotes)) {
      const notesToTurnOff = without(activeNotes, lastActiveNotes)

      // TODO: does this work with envelope too?
      if (!isEmpty(notesToTurnOff)) {
        this._.timbre.noteOff(notesToTurnOff)
      }

      if (!isEmpty(activeNotes)) {
        this._.timbre.noteOn(activeNotes)
      }
    }
  }

  noteOn(frequencies) {
    if (!isEmpty(frequencies)) {
      this._.lastPressedNotes = this._.pressedNotes
      this._.pressedNotes = append(head(frequencies), this._.pressedNotes)

      // console.log('on', this._.lastPressedNotes, this._.pressedNotes)

      this._noteDiff()
    }
  }

  noteOff(frequencies) {
    if (!isEmpty(frequencies)) {
      this._.lastPressedNotes = this._.pressedNotes
      this._.pressedNotes = without([head(frequencies)], this._.pressedNotes)

      // console.log('off', this._.lastPressedNotes, this._.pressedNotes)

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
