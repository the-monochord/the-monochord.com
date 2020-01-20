class AbstractTimbre {
  constructor(ctx) {
    this._ = {
      ctx,
      settings: {}
    }
  }

  update(settings) {
    this._.settings = settings
  }

  reset() {}
  noteOn() {}
  noteOff() {}
}

export default AbstractTimbre
