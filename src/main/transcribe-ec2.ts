import { EC2_WHISPER_PORT } from './whisper-tunnel'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Optional vocabulary prompt: ~/.aurora/prompt.txt
// Whisper uses it as an initial prompt to bias recognition toward these words/spellings.
// Format: comma-separated terms or natural prose, e.g.:
//   Claude, Cursor, Obsidian, TypeScript, Karabiner, macOS, EC2
function loadPrompt(): string {
  try {
    return readFileSync(join(homedir(), '.aurora', 'prompt.txt'), 'utf-8').trim()
  } catch {
    return ''
  }
}

export async function transcribeWithEc2Whisper(wavBuffer: Buffer): Promise<string> {
  const prompt = loadPrompt()

  // Build multipart/form-data manually — no fetch FormData in Node.js without extra deps
  const boundary = `----aurora${Date.now()}`
  const CRLF = '\r\n'

  const parts: string[] = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="audio.wav"',
    'Content-Type: audio/wav',
    '', '',
  ]

  const footer: string[] = [
    '',
    `--${boundary}`,
    'Content-Disposition: form-data; name="response_format"',
    '', 'json',
    `--${boundary}`,
    'Content-Disposition: form-data; name="language"',
    '', 'auto',
  ]

  if (prompt) {
    footer.push(
      `--${boundary}`,
      'Content-Disposition: form-data; name="prompt"',
      '', prompt,
    )
  }

  footer.push(`--${boundary}--`, '')

  const body = Buffer.concat([
    Buffer.from(parts.join(CRLF), 'utf-8'),
    wavBuffer,
    Buffer.from(footer.join(CRLF), 'utf-8'),
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
