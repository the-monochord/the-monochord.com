import { VirtualAudioContext, patch, render, diff } from 'virtual-webaudio'
import { forEach, isEmpty } from 'ramda'

const unitOfDurationInSeconds = 0.02
let old = null

const sound = (voices, { baseVolume, waveform }, wave) => {
  const ctx = new VirtualAudioContext()
  if (!isEmpty(voices)) {
    wave.setCtx(ctx)
  }

  forEach(({ frequency, volumes }) => {
    const osc = wave.createOscillator(waveform, frequency)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(
      volumes[0].volume * (baseVolume / 100),
      ctx.currentTime + volumes[0].duration * unitOfDurationInSeconds
    )

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
  }, voices)

  return ctx
}

const change = (virtualCtx, ctx) => {
  if (old === null) {
    render(virtualCtx, ctx)
  } else {
    patch(diff(old, virtualCtx), ctx)
  }

  old = virtualCtx
}

export { sound, change }
