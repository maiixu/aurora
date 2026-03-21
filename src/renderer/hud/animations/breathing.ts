// LISTENING: 5 waveform bars bouncing with audio level

const W = 200, H = 52
const BAR_COUNT = 5
const BAR_W = 3.5
const BAR_GAP = 5.5
const TOTAL_W = BAR_COUNT * BAR_W + (BAR_COUNT - 1) * BAR_GAP
const START_X = (W - TOTAL_W) / 2

export function drawBreathing(ctx: CanvasRenderingContext2D, t: number, volume: number) {
  const minH = 6
  const maxH = 30

  for (let i = 0; i < BAR_COUNT; i++) {
    const phase = t * 0.0045 + i * 0.75
    const idle = 0.25 + 0.2 * Math.sin(phase)
    const driven = volume * (0.7 + 0.3 * Math.sin(phase * 1.3))
    const level = Math.min(1, Math.max(idle, driven))
    const barH = minH + level * (maxH - minH)

    const x = START_X + i * (BAR_W + BAR_GAP)
    const y = (H - barH) / 2

    ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + level * 0.55})`
    ctx.beginPath()
    ctx.roundRect(x, y, BAR_W, barH, 1.5)
    ctx.fill()
  }
}
