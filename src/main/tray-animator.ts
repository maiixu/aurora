import { Tray, nativeImage } from 'electron'
import { AppState } from '../shared/types'

const SIZE = 22       // logical px
const DPR  = 2        // retina
const PX   = SIZE * DPR  // physical px

const GREEN = { r: 74,  g: 222, b: 128 }
const RED   = { r: 248, g: 113, b: 113 }
const WHITE = { r: 255, g: 255, b: 255 }

function buildImage(
  coreColor: { r: number; g: number; b: number },
  coreAlpha: number,
  glowAlpha: number,
): Electron.NativeImage {
  const buf = Buffer.alloc(PX * PX * 4, 0)
  const cx = PX / 2, cy = PX / 2
  const coreR = PX * 0.22
  const glowR = coreR * 1.7

  for (let y = 0; y < PX; y++) {
    for (let x = 0; x < PX; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      let a = 0
      let { r, g, b } = coreColor
      if (d <= coreR) {
        a = coreAlpha
      } else if (d <= glowR) {
        // soft fade-out glow
        a = glowAlpha * (1 - (d - coreR) / (glowR - coreR))
      }
      const i = (y * PX + x) * 4
      buf[i]   = r
      buf[i+1] = g
      buf[i+2] = b
      buf[i+3] = Math.round(Math.min(1, a) * 255)
    }
  }
  return nativeImage.createFromBuffer(buf, { width: PX, height: PX, scaleFactor: DPR })
}

// Pre-render breathing frames (20 steps)
const FRAMES_BREATHING = Array.from({ length: 20 }, (_, i) => {
  const t = i / 20 * Math.PI * 2
  const pulse = 0.3 + 0.15 * Math.sin(t)
  return buildImage(GREEN, 1.0, pulse)
})

// Pre-render processing frames (20 steps — brightness pulse on white)
const FRAMES_PROCESSING = Array.from({ length: 20 }, (_, i) => {
  const t = i / 20 * Math.PI * 2
  const alpha = 0.5 + 0.3 * Math.sin(t)
  return buildImage(WHITE, alpha, 0)
})

const IMG_READY     = buildImage(GREEN, 1.0, 0.5)
const IMG_CANCELLED = buildImage(RED,   1.0, 0.4)
const IMG_IDLE      = buildImage(GREEN, 1.0, 0.3)

export class TrayAnimator {
  private tray: Tray
  private timer: NodeJS.Timeout | null = null
  private frame = 0
  private state: AppState = AppState.IDLE

  constructor(tray: Tray) {
    this.tray = tray
    this.tray.setImage(IMG_IDLE)
  }

  setState(state: AppState) {
    if (state === this.state) return
    this.state = state
    this.frame = 0
    this.stopTimer()

    switch (state) {
      case AppState.IDLE:
        this.tray.setImage(IMG_IDLE)
        break
      case AppState.LISTENING:
        this.startTimer(FRAMES_BREATHING, 50)   // ~20fps breathing
        break
      case AppState.PROCESSING:
      case AppState.TRANSCRIBING:
        this.startTimer(FRAMES_PROCESSING, 60)
        break
      case AppState.READY:
        this.tray.setImage(IMG_READY)
        break
      case AppState.CANCELLED:
        this.tray.setImage(IMG_CANCELLED)
        break
    }
  }

  private startTimer(frames: Electron.NativeImage[], interval: number) {
    this.timer = setInterval(() => {
      this.tray.setImage(frames[this.frame % frames.length])
      this.frame++
    }, interval)
  }

  private stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }
}
