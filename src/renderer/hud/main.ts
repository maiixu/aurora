import { AppState } from '../../shared/types'
import { Animator } from './animator'
import { startVolumeMeter } from './volume-meter'
import { Recorder } from './recorder'

const canvas = document.getElementById('hud-canvas') as HTMLCanvasElement
const dpr = window.devicePixelRatio || 2
const W = window.innerWidth
const H = window.innerHeight
canvas.width  = W * dpr
canvas.height = H * dpr
canvas.style.width  = W + 'px'
canvas.style.height = H + 'px'

const animator = new Animator(canvas)
const recorder = new Recorder()
window.aurora.ready()

let stopVolumeMeter: (() => void) | null = null

window.aurora.onStateChange((state: AppState) => {
  animator.setState(state)

  if (state === AppState.LISTENING) {
    recorder.start().catch(console.error)
    startVolumeMeter((rms) => animator.setVolume(rms)).then(stop => {
      stopVolumeMeter = stop
    })
  } else if (state === AppState.PROCESSING) {
    stopVolumeMeter?.(); stopVolumeMeter = null
    const wav = recorder.stop()
    window.aurora.sendAudio(wav)
  } else if (state === AppState.CANCELLED) {
    stopVolumeMeter?.(); stopVolumeMeter = null
    recorder.cancel()
  }
})

declare global {
  interface Window {
    aurora: {
      onStateChange: (cb: (state: AppState) => void) => void
      onVolumeChange: (cb: (level: number) => void) => void
      ready:     () => void
      sendAudio: (audio: Uint8Array) => void
      sendText:  (text: string) => void
      sendError: (msg: string)  => void
    }
  }
}
