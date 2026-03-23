import { AppState } from '../../shared/types'
import { ANIM_READY_DISPLAY, ANIM_CANCELLED_DISPLAY } from '../../shared/constants'

const FONT_SIZE    = 13
const LINE_HEIGHT  = 18
const PADDING_V    = 8
const PADDING_H    = 8
const DOT_RADIUS   = 5   // dot radius in TRANSCRIBING (22px total → r=11 at full size; shrunk to 5 here)
const DOT_OFFSET   = 4   // px from top-left corner to dot center

export class Animator {
  private ctx: CanvasRenderingContext2D
  private W: number
  private H: number
  private CX: number
  private CY: number
  private state: AppState = AppState.IDLE
  private stateEnteredAt = 0
  private raf: number | null = null

  // TRANSCRIBING state
  private accText   = ''
  private partial   = false
  private lineCount = 0   // tracks rendered line count to drive dynamic panel resize

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 2
    this.ctx.scale(dpr, dpr)
    this.W = canvas.clientWidth  || canvas.width / dpr
    this.H = canvas.clientHeight || canvas.height / dpr
    this.CX = this.W / 2
    this.CY = this.H / 2

    // Sync canvas when main process resizes the BrowserWindow
    window.addEventListener('resize', () => {
      const d = window.devicePixelRatio || 2
      const W = window.innerWidth, H = window.innerHeight
      canvas.width  = W * d; canvas.height = H * d
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      this.ctx.scale(d, d)
      this.W = W; this.H = H; this.CX = W / 2; this.CY = H / 2
    })

    this.loop()
  }

  setState(state: AppState) {
    if (state === this.state) return
    const prev = this.state
    this.state = state
    this.stateEnteredAt = performance.now()

    // Reset transcript state when entering TRANSCRIBING
    if (state === AppState.TRANSCRIBING) {
      this.accText = ''
      this.partial = false
      this.lineCount = 0
    }
    // On IDLE after TRANSCRIBING/READY, clear accumulated text
    if (state === AppState.IDLE && (prev === AppState.TRANSCRIBING || prev === AppState.READY || prev === AppState.CANCELLED)) {
      this.accText = ''
      this.partial = false
      this.lineCount = 0
    }

    // Update canvas size from the new window dimensions
    const dpr = window.devicePixelRatio || 2
    const W = window.innerWidth
    const H = window.innerHeight
    const canvas = this.ctx.canvas
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = W + 'px'
    canvas.style.height = H + 'px'
    this.ctx.scale(dpr, dpr)
    this.W  = W
    this.H  = H
    this.CX = W / 2
    this.CY = H / 2
  }

  appendToken(text: string) {
    this.accText += text
  }

  setPartial(partial: boolean) {
    this.partial = partial
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

      case AppState.TRANSCRIBING: {
        this.drawTranscribingPanel(t)
        break
      }

      case AppState.READY: {
        // If we have transcript text (came from TRANSCRIBING), show text panel + green tint
        if (this.accText) {
          this.drawTranscribingPanel(t, 'rgba(74, 222, 128, 0.15)')
          if (elapsed >= ANIM_READY_DISPLAY) window.aurora.ready()
        } else {
          // Normal dot-only READY (e.g. direct PROCESSING → READY without streaming)
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
        }
        break
      }

      case AppState.CANCELLED: {
        if (this.accText && this.partial) {
          // Partial stream failure with text: amber tint over transcript
          this.drawTranscribingPanel(t, 'rgba(251, 191, 36, 0.15)')
        } else {
          // Clean cancel or no text: red dot
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
        }
        break
      }
    }
  }

  private drawTranscribingPanel(t: number, overlayColor?: string) {
    const { ctx, W, H } = this

    // Panel background
    ctx.save()
    ctx.beginPath()
    const r = 6
    ctx.moveTo(r, 0)
    ctx.lineTo(W - r, 0)
    ctx.quadraticCurveTo(W, 0, W, r)
    ctx.lineTo(W, H - r)
    ctx.quadraticCurveTo(W, H, W - r, H)
    ctx.lineTo(r, H)
    ctx.quadraticCurveTo(0, H, 0, H - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fill()

    // Optional tint overlay (green = READY, amber = partial CANCELLED)
    if (overlayColor) {
      ctx.fillStyle = overlayColor
      ctx.fill()
    }

    ctx.restore()

    // Dot: small green pulse in top-left corner
    const dotX = DOT_OFFSET + DOT_RADIUS + 2
    const dotY = DOT_OFFSET + DOT_RADIUS + 2
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.002)
    ctx.beginPath()
    ctx.arc(dotX, dotY, DOT_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`
    ctx.fill()

    // Text area: starts after dot row, with left padding
    const textX = DOT_OFFSET + DOT_RADIUS * 2 + PADDING_H + 4
    const textAreaTop = PADDING_V
    const textAreaH = H - 2 * PADDING_V
    const maxLines = Math.max(1, Math.floor(textAreaH / LINE_HEIGHT))

    ctx.font = `${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`
    ctx.textBaseline = 'top'

    if (!this.accText) {
      // Empty state: blinking cursor (500ms period)
      const cursorVisible = Math.floor(t / 500) % 2 === 0
      if (cursorVisible) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillRect(textX, textAreaTop + (LINE_HEIGHT - FONT_SIZE) / 2, 1, FONT_SIZE)
      }
      return
    }

    // Wrap accumulated text into lines
    const lines = this.wrapText(this.accText, W - textX - PADDING_H * 2)

    // Grow the panel when line count increases
    if (lines.length !== this.lineCount) {
      this.lineCount = lines.length
      window.aurora.resizePanel(lines.length)
    }

    // Show only last maxLines lines (top truncation when capped)
    const displayLines = lines.slice(-maxLines)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    for (let i = 0; i < displayLines.length; i++) {
      ctx.fillText(displayLines[i], textX, textAreaTop + i * LINE_HEIGHT)
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = []
    let current = ''

    // Try adding a chunk; if it overflows, break character-by-character
    const tryAdd = (chunk: string, separator = '') => {
      const candidate = current ? current + separator + chunk : chunk
      if (this.ctx.measureText(candidate).width <= maxWidth) {
        current = candidate
        return
      }
      // chunk itself is too wide → flush current line, then go char-by-char
      if (current) { lines.push(current); current = '' }
      for (const ch of chunk) {
        const c = current + ch
        if (this.ctx.measureText(c).width <= maxWidth) {
          current = c
        } else {
          if (current) lines.push(current)
          current = ch
        }
      }
    }

    for (const word of text.split(' ')) {
      tryAdd(word, current ? ' ' : '')
    }
    if (current) lines.push(current)
    return lines.length ? lines : ['']
  }
}
