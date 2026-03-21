import { AppState } from '../../shared/types'
import { ANIM_READY_DISPLAY, ANIM_CANCELLED_DISPLAY } from '../../shared/constants'

export class Animator {
  private ctx: CanvasRenderingContext2D
  private W: number
  private H: number
  private CX: number
  private CY: number
  private state: AppState = AppState.IDLE
  private stateEnteredAt = 0
  private raf: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 2
    this.ctx.scale(dpr, dpr)
    // Use actual CSS size (logical pixels) so dot fills the window regardless of screen
    this.W = canvas.clientWidth  || canvas.width / dpr
    this.H = canvas.clientHeight || canvas.height / dpr
    this.CX = this.W / 2
    this.CY = this.H / 2
    this.loop()
  }

  setState(state: AppState) {
    if (state === this.state) return
    this.state = state
    this.stateEnteredAt = performance.now()
  }

  setVolume(_level: number) {}

  private loop() {
    this.draw()
    this.raf = requestAnimationFrame(() => this.loop())
  }

  private draw() {
    const { ctx, CX, CY, W, H } = this
    const t = performance.now()
    const elapsed = t - this.stateEnteredAt
    // Scale radii proportionally to window size (designed at 20px baseline)
    const s = W / 20

    ctx.clearRect(0, 0, W, H)
    if (this.state === AppState.IDLE) return

    switch (this.state) {
      case AppState.LISTENING: {
        const pulse = 0.3 + 0.15 * Math.sin(t * 0.005)
        ctx.beginPath()
        ctx.arc(CX, CY, 8 * s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(CX, CY, 5 * s, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(74, 222, 128, 1)'
        ctx.fill()
        break
      }

      case AppState.PROCESSING: {
        const angle = (t * 0.005) % (Math.PI * 2)
        ctx.beginPath()
        ctx.arc(CX, CY, 7 * s, angle, angle + Math.PI * 1.4)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.lineWidth = 2 * s
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(CX, CY, 2 * s, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fill()
        break
      }

      case AppState.READY: {
        const fadeIn  = Math.min(1, elapsed / 150)
        const fadeOut = elapsed > 700 ? Math.max(0, 1 - (elapsed - 700) / 300) : 1
        const alpha = fadeIn * fadeOut
        ctx.beginPath()
        ctx.arc(CX, CY, 7 * s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha * 0.3})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(CX, CY, 4.5 * s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`
        ctx.fill()
        if (elapsed >= ANIM_READY_DISPLAY) window.aurora.ready()
        break
      }

      case AppState.CANCELLED: {
        const fadeIn  = Math.min(1, elapsed / 100)
        const fadeOut = elapsed > 400 ? Math.max(0, 1 - (elapsed - 400) / 300) : 1
        const alpha = fadeIn * fadeOut
        ctx.beginPath()
        ctx.arc(CX, CY, 7 * s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(248, 113, 113, ${alpha * 0.3})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(CX, CY, 4.5 * s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`
        ctx.fill()
        break
      }
    }
  }
}
