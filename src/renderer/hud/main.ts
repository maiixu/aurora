import { AppState } from '../../shared/types'
import { Animator } from './animator'
import { startVolumeMeter } from './volume-meter'

const canvas = document.getElementById('hud-canvas') as HTMLCanvasElement
canvas.width  = 280
canvas.height = 72

const animator = new Animator(canvas)

// Signal to main process that HUD is ready
window.aurora.ready()

// Start volume meter immediately — stays running once mic is granted
startVolumeMeter((rms) => {
  animator.setVolume(rms)
})

// Wire state changes to animator
window.aurora.onStateChange((state: AppState) => {
  animator.setState(state)
})

declare global {
  interface Window {
    aurora: {
      onStateChange: (cb: (state: AppState) => void) => void
      onVolumeChange: (cb: (level: number) => void) => void
      ready: () => void
    }
  }
}
