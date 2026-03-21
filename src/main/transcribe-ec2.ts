import { EC2_WHISPER_PORT } from './whisper-tunnel'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { postprocess } from './postprocess'

// ~/.aurora/dictionary.txt format:
//
//   word1, word2, ...    ← whisper initial prompt (biases recognition)
//
//   [replace]            ← optional post-processing substitutions
//   cloud code = Claude Code
//   cloud = Claude
//
// Replacements are applied in order — put longer phrases before shorter ones.

interface Dictionary {
  prompt: string
  replacements: Array<{ from: string; to: string }>
}

function loadDictionary(): Dictionary {
  try {
    const raw = readFileSync(join(homedir(), '.aurora', 'dictionary.txt'), 'utf-8')
    const [promptSection, replaceSection] = raw.split(/^\[replace\]/m)

    const prompt = (promptSection ?? '').trim()

    const replacements = (replaceSection ?? '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.includes('='))
      .map(l => {
        const eq = l.indexOf('=')
        return { from: l.slice(0, eq).trim().toLowerCase(), to: l.slice(eq + 1).trim() }
      })

    return { prompt, replacements }
  } catch {
    return { prompt: '', replacements: [] }
  }
}

function applyReplacements(text: string, replacements: Array<{ from: string; to: string }>): string {
  let result = text
  for (const { from, to } of replacements) {
    // Case-insensitive, whole-word-aware replacement, preserves surrounding whitespace
    result = result.replace(new RegExp(`(?<![\\w])${escapeRegex(from)}(?![\\w])`, 'gi'), to)
  }
  return result
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function transcribeWithEc2Whisper(wavBuffer: Buffer): Promise<string> {
  const { prompt, replacements } = loadDictionary()

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
    footer.push(`--${boundary}`, 'Content-Disposition: form-data; name="prompt"', '', prompt)
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
  const raw = (json.text ?? '').trim()
  const replaced = replacements.length ? applyReplacements(raw, replacements) : raw
  return postprocess(replaced)
}
