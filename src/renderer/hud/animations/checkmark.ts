// READY state: ✓ flash then fade out over ~800ms

export function drawCheckmark(ctx: CanvasRenderingContext2D, elapsed: number) {
  const cx = 140, cy = 36
  // elapsed: ms since entering READY state
  // 0–200ms: appear, 200–600ms: hold, 600–800ms: fade
  let alpha: number
  if (elapsed < 200) {
    alpha = elapsed / 200
  } else if (elapsed < 600) {
    alpha = 1
  } else {
    alpha = 1 - (elapsed - 600) / 200
  }
  alpha = Math.max(0, Math.min(1, alpha))

  // Green circle
  ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, 16, 0, Math.PI * 2)
  ctx.stroke()

  // Checkmark path
  ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 8, cy)
  ctx.lineTo(cx - 2, cy + 7)
  ctx.lineTo(cx + 9, cy - 8)
  ctx.stroke()
}
