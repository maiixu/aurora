import { AppState } from '../../shared/types'

export class Animator {
  private ctx: CanvasRenderingContext2D
  private state: AppState = AppState.IDLE
  private raf: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.loop()
  }

  setState(state: AppState) {
    this.state = state
  }

  setVolume(_level: number) {
    // Wired in feat/animations
  }

  private loop() {
    this.draw()
    this.raf = requestAnimationFrame(() => this.loop())
  }

  private draw() {
    const { ctx } = this
    ctx.clearRect(0, 0, 280, 72)

    if (this.state === AppState.IDLE) return

    // Placeholder: dark pill background
    ctx.fillStyle = 'rgba(30, 30, 30, 0.85)'
    this.roundRect(ctx, 0, 0, 280, 72, 36)
    ctx.fill()

    // Placeholder: state label (replaced by real animations in feat/animations)
    ctx.fillStyle = '#ffffff'
    ctx.font = '13px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.state, 140, 36)
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
}
