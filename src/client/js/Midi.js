import EventEmitter from 'eventemitter3'

import {
  curry,
  clone,
  values,
  filter,
  compose,
  forEach,
  any,
  head,
  propEq,
  find,
  merge,
  includes,
  flatten,
  map
} from 'ramda'

import monochord from 'monochord-core'

const {
  midi: {
    constants: { whiteOnlyMap, commands, cc, defaultInputData, defaultOutputData, maxBendingDistanceInSemitones },
    commands: { setPitchBendLimit, bendPitch, noteOn, noteOff },
    helpers: { getNameFromPort, getAllKeys, getWhiteKeys },
    math: { getNoteId, getNoteFrequency, getBendingDistance }
  }
} = monochord

// TODO: rename this variable
const demoData = {}

// --------------------------

class MIDI extends EventEmitter {
  constructor() {
    super()

    this._ = {
      inited: false,
      status: {
        supported: false,
        devices: {
          inputs: {},
          outputs: {}
        }
      },
      whiteOnly: false
    }
  }

  set mode(value) {
    this._.whiteOnly = value
    forEach(note => {
      for (let channel = 1; channel <= 16; channel++) {
        this.emit('note off', note, 1, channel)
      }
    }, getAllKeys())
  }

  async init() {
    if (!this._.inited) {
      this._.inited = true

      const ready = () => {
        const { status } = this._
        this.emit('ready', clone(status))
      }

      const enableMidiSupport = midiAccess => {
        this._.status.supported = true

        midiAccess.onstatechange = event => {
          initPort(event.port)
        }

        const inputs = midiAccess.inputs.values()
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          initPort(input.value)
        }

        const outputs = midiAccess.outputs.values()
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
          initPort(output.value)
        }
      }

      const initPort = port => {
        const { status } = this._

        const name = getNameFromPort(port)

        if (port.type === 'input') {
          if (!status.devices.inputs[name]) {
            status.devices.inputs[name] = merge({ port }, defaultInputData)
          }

          status.devices.inputs[name].connected = false
          if (port.state === 'connected') {
            if (port.connection === 'closed') {
              port.open()
            } else if (port.connection === 'open') {
              port.onmidimessage = onMidiMessage(status.devices.inputs[name])
              status.devices.inputs[name].connected = true
            }
          }
        } else if (port.type === 'output') {
          if (!status.devices.outputs[name]) {
            status.devices.outputs[name] = merge({ port }, defaultOutputData)
          }

          if (port.state === 'connected') {
            if (port.connection === 'closed') {
              port.open()
            } else if (port.connection === 'open') {
              status.devices.outputs[name].connected = true
            }
          }
        }

        this.emit('update', clone(status))
      }

      const onMidiMessage = curry((device, event) => {
        if (device.enabled) {
          const { whiteOnly } = this._
          const [data, ...params] = event.data
          const cmd = data >> 4
          const channel = data & 0x0f

          if (device.channels[channel] && device.channels[channel].enabled) {
            switch (cmd) {
              case commands.noteOff:
                {
                  const [note, velocity] = params
                  if (whiteOnly) {
                    if (includes(note, getWhiteKeys())) {
                      this.emit('note off', whiteOnlyMap[note], (velocity / 128) * 100, channel)
                    }
                  } else {
                    this.emit('note off', note, (velocity / 128) * 100, channel)
                  }
                }
                break
              case commands.noteOn:
                {
                  const [note, velocity] = params
                  if (whiteOnly) {
                    if (includes(note, getWhiteKeys())) {
                      this.emit('note on', whiteOnlyMap[note], (velocity / 128) * 100, channel)
                    }
                  } else {
                    this.emit('note on', note, (velocity / 128) * 100, channel)
                  }
                }
                break
              case commands.aftertouch:
                {
                  const [note, pressure] = params
                  if (whiteOnly) {
                    if (includes(note, getWhiteKeys())) {
                      this.emit('aftertouch', whiteOnlyMap[note], (pressure / 128) * 100, channel)
                    }
                  } else {
                    this.emit('aftertouch', note, (pressure / 128) * 100, channel)
                  }
                }
                break
              case commands.pitchbend:
                {
                  const [low, high] = params
                  this.emit('pitchbend', (((high << 8) | low) / 0x3fff - 1) * 100)
                }
                break
              case commands.cc:
                {
                  const [cmd, value] = params

                  switch (cmd) {
                    case cc.sustain:
                      this.emit('sustain', value >= 64)
                      break
                  }
                }
                break
            }
          }
        }
      })

      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess({ sysex: false })
        enableMidiSupport(midiAccess)
        ready()
        // .catch -> error = 'SecurityError', ha sysex:true-nál blokkolta a user
      } else {
        ready()
      }
    }
  }

  toggleDevice(type, name) {
    const { status } = this._

    const device = status.devices[`${type}s`][name]
    device.enabled = !device.enabled

    if (type === 'output') {
      if (device.enabled) {
        forEach(channel => {
          device.port.send(setPitchBendLimit(channel, maxBendingDistanceInSemitones))
        })(device.channels)
      } else {
        forEach(channel => {
          device.port.send(bendPitch(channel, 0))
        })(device.channels)
      }
    }

    this.emit('update', clone(status))
  }

  toggleChannel(type, name, channelID) {
    const { status } = this._

    const device = status.devices[`${type}s`][name]

    if (device.enabled) {
      const channel = find(propEq('id', parseInt(channelID)))(device.channels)
      channel.enabled = !channel.enabled
      this.emit('update', clone(status))
    }
  }

  getEnabledOutputs() {
    return compose(
      filter(device => device.enabled && any(channel => channel.enabled)(device.channels)),
      values
    )(this._.status.devices.outputs)
  }

  getLowestEnabledChannel(channels) {
    return find(channel => channel.enabled, channels)
  }

  // -------------------------------------------

  playFrequency(frequency = 0, noteLength = Infinity) {
    // find midi devices, which are enabled and contain at least one open channel
    const devices = compose(
      filter(device => device.enabled && any(channel => channel.enabled)(device.channels)),
      values
    )(this._.status.devices.outputs)

    if (devices.length) {
      forEach(({ port, channels }) => {
        const channel = compose(head, filter(propEq('enabled', true)))(channels)
        const portName = getNameFromPort(port)
        if (!demoData[portName]) {
          demoData[portName] = {}
        }
        if (!demoData[portName][channel]) {
          demoData[portName][channel] = {
            pressedNoteIds: []
          }
        }

        if (frequency === 0) {
          if (demoData[portName][channel].pressedNoteIds.length) {
            port.send(
              compose(
                flatten,
                map(noteId => noteOff(channel, noteId))
              )(demoData[portName][channel].pressedNoteIds)
            )

            demoData[portName][channel].pressedNoteIds = []
          }
        } else {
          const noteId = parseInt(getNoteId(frequency).toString())
          const pitchbendAmount = parseFloat(getBendingDistance(frequency, getNoteFrequency(noteId)).toString())

          port.send(noteOn(channel, noteId, pitchbendAmount))
          demoData[portName][channel].pressedNoteIds.push(noteId)
          if (noteLength !== Infinity) {
            setTimeout(() => {
              this.playFrequency(0)
            }, noteLength)
          }
        }
      })(devices)
    }
  }

  stopFrequency() {
    this.playFrequency(0)
  }

  // -------------------------------------------
}

export default MIDI
