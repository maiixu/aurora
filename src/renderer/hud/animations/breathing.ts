// LISTENING state: mic icon with green breathing pulse tied to volume level

export function drawBreathing(ctx: CanvasRenderingContext2D, t: number, volume: number) {
  const cx = 140, cy = 36

  // Outer glow pulse: driven by volume (0–1), with a baseline idle pulse
  const idlePulse = 0.5 + 0.5 * Math.sin(t * 0.003)
  const pulse = Math.max(idlePulse, volume)
  const glowRadius = 22 + pulse * 14

  const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, glowRadius)
  grd.addColorStop(0, `rgba(52, 211, 153, ${0.35 + pulse * 0.35})`)
  grd.addColorStop(1, 'rgba(52, 211, 153, 0)')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
  ctx.fill()

  // Mic body
  const w = 10, h = 16, r = 5
  const mx = cx - w / 2, my = cy - h / 2 - 2

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(mx + r, my)
  ctx.arcTo(mx + w, my, mx + w, my + h, r)
  ctx.arcTo(mx + w, my + h, mx, my + h, r)
  ctx.arcTo(mx, my + h, mx, my, r)
  ctx.arcTo(mx, my, mx + w, my, r)
  ctx.closePath()
  ctx.fill()

  // Mic arc
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy + 6, 10, Math.PI, 0, true)
  ctx.stroke()

  // Stand
  ctx.beginPath()
  ctx.moveTo(cx, cy + 16)
  ctx.lineTo(cx, cy + 22)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - 6, cy + 22)
  ctx.lineTo(cx + 6, cy + 22)
  ctx.stroke()
}
