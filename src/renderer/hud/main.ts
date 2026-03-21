import { AppState } from '../../shared/types'
import { Animator } from './animator'

const canvas = document.getElementById('hud-canvas') as HTMLCanvasElement
canvas.width  = 280
canvas.height = 72

const animator = new Animator(canvas)

// Signal to main process that HUD is ready
window.aurora.ready()

// Wire state changes to animator
window.aurora.onStateChange((state: AppState) => {
  animator.setState(state)
})

// Volume is computed locally in volume-meter.ts (added in feat/animations)
// window.aurora.onVolumeChange is available but unused until then

// Declare global type for contextBridge API
declare global {
  interface Window {
    aurora: {
      onStateChange: (cb: (state: AppState) => void) => void
      onVolumeChange: (cb: (level: number) => void) => void
      ready: () => void
    }
  }
}
