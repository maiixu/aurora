// Captures microphone audio as 16kHz mono PCM, encodes to WAV.
// Uses ScriptProcessorNode (deprecated but reliable in Electron's Chromium).

const SAMPLE_RATE = 16000
const BUFFER_SIZE = 4096

export class Recorder {
  private ctx: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private stream: MediaStream | null = null
  private chunks: Float32Array[] = []
  private active = false

  async start(): Promise<void> {
    if (this.active) return
    this.chunks = []
    this.active = true
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
      const source = this.ctx.createMediaStreamSource(this.stream)
      this.processor = this.ctx.createScriptProcessor(BUFFER_SIZE, 1, 1)
      this.processor.onaudioprocess = (e) => {
        if (!this.active) return
        const data = e.inputBuffer.getChannelData(0)
        this.chunks.push(new Float32Array(data))
      }
      source.connect(this.processor)
      this.processor.connect(this.ctx.destination)
    } catch (err) {
      console.error('[recorder] start failed:', err)
      this.active = false
    }
  }

  /** Stop recording and return WAV-encoded audio as Uint8Array. */
  stop(): Uint8Array {
    this.active = false
    this._cleanup()
    return this._encodeWav()
  }

  /** Cancel recording without returning audio (e.g. on CANCELLED state). */
  cancel(): void {
    this.active = false
    this.chunks = []
    this._cleanup()
  }

  private _cleanup() {
    this.processor?.disconnect()
    this.stream?.getTracks().forEach(t => t.stop())
    this.ctx?.close()
    this.processor = null
    this.stream = null
    this.ctx = null
  }

  private _encodeWav(): Uint8Array {
    const totalSamples = this.chunks.reduce((s, c) => s + c.length, 0)
    const pcm = new Int16Array(totalSamples)
    let offset = 0
    for (const chunk of this.chunks) {
      for (let i = 0; i < chunk.length; i++) {
        pcm[offset++] = Math.max(-32768, Math.min(32767, chunk[i] * 32768))
      }
    }
    this.chunks = []

    const dataBytes = pcm.length * 2
    const buf = new ArrayBuffer(44 + dataBytes)
    const v = new DataView(buf)
    const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)) }

    str(0, 'RIFF');  v.setUint32(4,  36 + dataBytes, true)
    str(8, 'WAVE');  str(12, 'fmt ')
    v.setUint32(16, 16, true)            // fmt chunk size
    v.setUint16(20, 1,  true)            // PCM
    v.setUint16(22, 1,  true)            // mono
    v.setUint32(24, SAMPLE_RATE, true)   // sample rate
    v.setUint32(28, SAMPLE_RATE * 2, true) // byte rate
    v.setUint16(32, 2, true)             // block align
    v.setUint16(34, 16, true)            // bits per sample
    str(36, 'data'); v.setUint32(40, dataBytes, true)
    new Int16Array(buf, 44).set(pcm)

    return new Uint8Array(buf)
  }
}
