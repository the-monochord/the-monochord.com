import EventEmitter from 'eventemitter3'
// import AudioFileManager from 'audio'

class Audio extends EventEmitter {
  constructor() {
    super()

    this._ = {
      sequences: []
    }
  }
  isSupported() {
    return !!window.hasOwnProperty('AudioContext')
  }

  async init() {
    this.emit('ready')
  }

  play() {}
  pause() {}
  stop() {}

  renderToWav(filename) {
    // AudioFileManager(buffer.get()).save(filename)
  }
}

export default Audio
