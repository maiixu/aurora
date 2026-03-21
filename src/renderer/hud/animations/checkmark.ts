// READY: checkmark draws in then fades

const W = 200, H = 52

export function drawCheckmark(ctx: CanvasRenderingContext2D, elapsed: number) {
  const cx = W / 2, cy = H / 2

  let alpha: number
  if (elapsed < 150)       alpha = elapsed / 150
  else if (elapsed < 700)  alpha = 1
  else                     alpha = 1 - (elapsed - 700) / 200
  alpha = Math.max(0, Math.min(1, alpha))

  // Draw progress: check animates in over 300ms
  const drawProgress = Math.min(1, elapsed / 300)

  ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Checkmark: two segments — first 40% = short leg, rest = long leg
  const p1 = { x: cx - 9, y: cy }
  const p2 = { x: cx - 2, y: cy + 8 }
  const p3 = { x: cx + 10, y: cy - 9 }

  const seg1Len = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  const seg2Len = Math.hypot(p3.x - p2.x, p3.y - p2.y)
  const totalLen = seg1Len + seg2Len
  const drawn = drawProgress * totalLen

  ctx.beginPath()
  if (drawn <= seg1Len) {
    const t = drawn / seg1Len
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t)
  } else {
    const t = (drawn - seg1Len) / seg2Len
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p2.x + (p3.x - p2.x) * t, p2.y + (p3.y - p2.y) * t)
  }
  ctx.stroke()
}
