import { EC2_WHISPER_PORT } from './whisper-tunnel'

export async function transcribeWithEc2Whisper(wavBuffer: Buffer): Promise<string> {
  // Build multipart/form-data manually — no fetch FormData in Node.js without extra deps
  const boundary = `----aurora${Date.now()}`
  const CRLF = '\r\n'

  const header = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="audio.wav"',
    'Content-Type: audio/wav',
    '',
    '',
  ].join(CRLF)

  const footer = [
    '',
    `--${boundary}`,
    'Content-Disposition: form-data; name="response_format"',
    '',
    'json',
    `--${boundary}`,
    'Content-Disposition: form-data; name="language"',
    '',
    'auto',
    `--${boundary}--`,
    '',
  ].join(CRLF)

  const body = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    wavBuffer,
    Buffer.from(footer, 'utf-8'),
  ])

  const res = await fetch(`http://localhost:${EC2_WHISPER_PORT}/inference`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  })

  if (!res.ok) throw new Error(`whisper-server ${res.status}: ${await res.text()}`)

  const json = await res.json() as { text?: string }
  return (json.text ?? '').trim()
}
