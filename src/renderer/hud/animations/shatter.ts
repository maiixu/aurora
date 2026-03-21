// CANCELLED state: red flash + particle dissolve over ~600ms

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number; alpha: number
}

let particles: Particle[] = []

export function initShatter() {
  particles = []
  const cx = 140, cy = 36
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2
    const speed = 1.5 + Math.random() * 2.5
    particles.push({
      x: cx + Math.cos(angle) * 8,
      y: cy + Math.sin(angle) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      r: 2 + Math.random() * 3,
      alpha: 1,
    })
  }
}

export function drawShatter(ctx: CanvasRenderingContext2D, elapsed: number) {
  // elapsed: ms since CANCELLED
  const progress = Math.min(elapsed / 600, 1)

  // Whole-HUD red flash (fast, 0–150ms)
  if (elapsed < 150) {
    const flashAlpha = (1 - elapsed / 150) * 0.55
    ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha})`
    roundRect(ctx, 0, 0, 280, 72, 36)
    ctx.fill()
  }

  // Particles
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.08  // gravity
    p.alpha = Math.max(0, 1 - progress * 1.4)

    ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * (1 - progress * 0.5), 0, Math.PI * 2)
    ctx.fill()
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
