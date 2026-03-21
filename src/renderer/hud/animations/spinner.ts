// PROCESSING: three dots pulsing in sequence

const W = 200, H = 52
const DOT_R = 3.5
const DOT_GAP = 11
const DOT_COUNT = 3
const DOTS_W = DOT_COUNT * DOT_R * 2 + (DOT_COUNT - 1) * (DOT_GAP - DOT_R * 2)

export function drawSpinner(ctx: CanvasRenderingContext2D, t: number) {
  const startX = W / 2 - (DOT_COUNT - 1) * DOT_GAP / 2

  for (let i = 0; i < DOT_COUNT; i++) {
    const phase = (t * 0.004 - i * 0.6) % (Math.PI * 2)
    const scale = 0.55 + 0.45 * Math.sin(phase)
    const alpha = 0.35 + 0.65 * scale
    const r = DOT_R * (0.7 + 0.3 * scale)

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(startX + i * DOT_GAP, H / 2, r, 0, Math.PI * 2)
    ctx.fill()
  }
}
