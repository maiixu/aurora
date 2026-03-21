import { AppState } from '../../shared/types'
import { drawBreathing } from './animations/breathing'
import { drawSpinner } from './animations/spinner'
import { drawCheckmark } from './animations/checkmark'
import { drawShatter, initShatter } from './animations/shatter'
import { ANIM_READY_DISPLAY, ANIM_CANCELLED_DISPLAY } from '../../shared/constants'

export class Animator {
  private ctx: CanvasRenderingContext2D
  private state: AppState = AppState.IDLE
  private volume = 0
  private stateEnteredAt = 0
  private raf: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.loop()
  }

  setState(state: AppState) {
    if (state === this.state) return
    this.state = state
    this.stateEnteredAt = performance.now()
    if (state === AppState.CANCELLED) initShatter()
  }

  setVolume(level: number) {
    this.volume = level
  }

  private loop() {
    this.draw()
    this.raf = requestAnimationFrame(() => this.loop())
  }

  private draw() {
    const { ctx } = this
    const t = performance.now()
    const elapsed = t - this.stateEnteredAt

    ctx.clearRect(0, 0, 280, 72)

    if (this.state === AppState.IDLE) return

    // Background pill (vibrancy handles the actual frosted glass;
    // canvas draws a semi-transparent overlay for consistent contrast)
    ctx.fillStyle = 'rgba(20, 20, 20, 0.60)'
    this.pill(ctx)
    ctx.fill()

    switch (this.state) {
      case AppState.LISTENING:
        drawBreathing(ctx, t, this.volume)
        break

      case AppState.PROCESSING:
        drawSpinner(ctx, t)
        break

      case AppState.READY:
        drawCheckmark(ctx, elapsed)
        // Notify main process to hide after animation completes
        if (elapsed >= ANIM_READY_DISPLAY) {
          window.aurora.ready()  // reuse as "animation done" signal — harmless duplicate
        }
        break

      case AppState.CANCELLED:
        drawShatter(ctx, elapsed)
        break
    }
  }

  private pill(ctx: CanvasRenderingContext2D) {
    const r = 36
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.arcTo(280, 0, 280, 72, r)
    ctx.arcTo(280, 72, 0, 72, r)
    ctx.arcTo(0, 72, 0, 0, r)
    ctx.arcTo(0, 0, 280, 0, r)
    ctx.closePath()
  }
}
