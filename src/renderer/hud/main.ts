import { AppState } from '../../shared/types'
import { Animator } from './animator'
import { startVolumeMeter } from './volume-meter'

const canvas = document.getElementById('hud-canvas') as HTMLCanvasElement
canvas.width  = 280
canvas.height = 72

const animator = new Animator(canvas)
window.aurora.ready()

// Volume meter — local only, drives the breathing animation
startVolumeMeter((rms) => animator.setVolume(rms))

// State changes drive animation only; voice I/O is handled by ChatGPT window
window.aurora.onStateChange((state: AppState) => {
  animator.setState(state)
})

declare global {
  interface Window {
    aurora: {
      onStateChange: (cb: (state: AppState) => void) => void
      onVolumeChange: (cb: (level: number) => void) => void
      ready:     () => void
      sendText:  (text: string) => void
      sendError: (msg: string)  => void
    }
  }
}
