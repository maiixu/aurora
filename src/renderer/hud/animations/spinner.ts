// PROCESSING state: minimal progress ring + ripple

export function drawSpinner(ctx: CanvasRenderingContext2D, t: number) {
  const cx = 140, cy = 36
  const angle = (t * 0.004) % (Math.PI * 2)

  // Ripple rings that expand outward
  for (let i = 0; i < 2; i++) {
    const phase = ((t * 0.002) + i * Math.PI) % (Math.PI * 2)
    const r = 12 + (phase / (Math.PI * 2)) * 12
    const alpha = 1 - phase / (Math.PI * 2)
    ctx.strokeStyle = `rgba(180, 180, 180, ${alpha * 0.5})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Arc progress ring
  ctx.strokeStyle = 'rgba(220, 220, 220, 0.9)'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, 14, angle, angle + Math.PI * 1.4)
  ctx.stroke()
}
