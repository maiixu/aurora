import { AppState } from '../../shared/types'
import { Animator } from './animator'
import { startVolumeMeter } from './volume-meter'
import { createSpeechRecognizer } from './speech'

const canvas = document.getElementById('hud-canvas') as HTMLCanvasElement
canvas.width  = 280
canvas.height = 72

const animator = new Animator(canvas)
window.aurora.ready()

// Volume meter — local only, drives the breathing animation
startVolumeMeter((rms) => animator.setVolume(rms))

// Speech recognizer — result goes to main process → clipboard → FSM
const rec = createSpeechRecognizer(
  (text) => window.aurora.sendText(text),
  (msg)  => window.aurora.sendError(msg),
)

window.aurora.onStateChange((state: AppState) => {
  animator.setState(state)

  if (state === AppState.LISTENING) {
    rec?.start()
  } else if (state === AppState.PROCESSING) {
    rec?.stop()
  } else if (state === AppState.CANCELLED) {
    rec?.abort()
  }
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
