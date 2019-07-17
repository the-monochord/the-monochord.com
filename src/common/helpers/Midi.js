/* global navigator */

import { forEach } from 'ramda'
import EventEmitter from 'eventemitter3'

// https://www.midi.org/specifications/item/table-1-summary-of-midi-message
const commands = {
  noteOn: 0b1001,
  noteOff: 0b1000,
  cc: 0b1011
}

// https://www.midi.org/specifications/item/table-3-control-change-messages-data-bytes-2
// http://www.nortonmusic.com/midi_cc.html
const cc = {
  sustain: 64
}

class Midi extends EventEmitter {
  isSupported() {
    return !!navigator.requestMIDIAccess
  }

  async init() {
    const enableMidiSupport = midiAccess => {
      midiAccess.onstatechange = event => {
        initPort(event.port)
      }

      forEach(initPort, Array.from(midiAccess.inputs.values()))
    }

    const initPort = port => {
      if (port.type === 'input' && port.state === 'connected') {
        if (port.connection === 'closed') {
          port.open()
        } else if (port.connection === 'open') {
          port.onmidimessage = ({ data: [data, ...params] }) => {
            const cmd = data >> 4
            const channel = data & 0x0f

            switch (cmd) {
              case commands.noteOff:
                {
                  const [note, velocity] = params
                  this.emit('note off', note, (velocity / 128) * 100, channel)
                }
                break
              case commands.noteOn:
                {
                  const [note, velocity] = params
                  // based on: https://github.com/SeanArchibald/scale-workshop/commit/7227958c50b098f6b06eb5b2c1b5d2363039c392
                  if (velocity > 0) {
                    this.emit('note on', note, (velocity / 128) * 100, channel)
                  } else {
                    this.emit('note off', note, 100, channel)
                  }
                }
                break
              case commands.cc:
                {
                  const [cmd, value] = params
                  if (cmd === cc.sustain) {
                    this.emit(value >= 64 ? 'sustain on' : 'sustain off')
                  }
                }
                break
            }
          }
        }
      }
    }

    if (this.isSupported()) {
      try {
        const midiAccess = await navigator.requestMIDIAccess()
        enableMidiSupport(midiAccess)
        this.emit('ready')
      } catch (e) {
        this.emit('blocked')
      }
    }
  }
}

export default Midi
