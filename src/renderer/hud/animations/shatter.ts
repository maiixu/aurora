// CANCELLED: quick red X that fades out

const W = 200, H = 52

export function initShatter() {}  // no-op, kept for API compat

export function drawShatter(ctx: CanvasRenderingContext2D, elapsed: number) {
  let alpha: number
  if (elapsed < 100)       alpha = elapsed / 100
  else if (elapsed < 500)  alpha = 1
  else                     alpha = 1 - (elapsed - 500) / 200
  alpha = Math.max(0, Math.min(1, alpha))

  const cx = W / 2, cy = H / 2
  const s = 9

  ctx.strokeStyle = `rgba(248, 113, 113, ${alpha})`
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(cx - s, cy - s)
  ctx.lineTo(cx + s, cy + s)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx + s, cy - s)
  ctx.lineTo(cx - s, cy + s)
  ctx.stroke()
}
