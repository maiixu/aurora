// Captures mic input locally (purely for visualization).
// Computes RMS every animation frame and calls onVolume(0.0–1.0).

export async function startVolumeMeter(onVolume: (rms: number) => void): Promise<() => void> {
  let stream: MediaStream | null = null
  let raf: number | null = null

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)

    const buf = new Float32Array(analyser.fftSize)

    const tick = () => {
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      // Normalise: typical speech peaks ~0.1 RMS → map to 0–1 with soft ceiling
      onVolume(Math.min(rms * 8, 1))
      raf = requestAnimationFrame(tick)
    }
    tick()
  } catch {
    // Mic permission not granted yet — volume stays at 0, breathing uses idle pulse
  }

  return () => {
    if (raf !== null) cancelAnimationFrame(raf)
    stream?.getTracks().forEach(t => t.stop())
  }
}
