import { EC2_WHISPER_PORT } from './whisper-tunnel'
import { EventEmitter } from 'events'
import { postprocess } from './postprocess'
import { loadDictionary, applyReplacements } from './dictionary'

// transcribeWithEc2Whisper returns an EventEmitter immediately.
// Events:
//   'token'  (text: string)  — one streamed segment/chunk from whisper
//   'done'   (full: string)  — inference complete; full = canonical paste text (post-processed)
//   'error'  (err: Error)    — fatal error (< 5 tokens received)
//
// On SSE stream close without 'done', if ≥5 tokens were received, emits 'done' with
// accumulated text (partial recovery path → amber HUD state).
export function transcribeWithEc2Whisper(wavBuffer: Buffer): EventEmitter {
  const emitter = new EventEmitter()
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

  // Run async streaming in background; emit events to caller
  ;(async () => {
    let accumulated = ''
    let tokenCount = 0

    try {
      const res = await fetch(`http://localhost:${EC2_WHISPER_PORT}/inference`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Accept': 'text/event-stream',
        },
        body,
      })

      if (!res.ok) {
        throw new Error(`whisper-server ${res.status}: ${await res.text()}`)
      }

      if (!res.body) {
        throw new Error('whisper-server: empty response body')
      }

      const contentType = res.headers.get('content-type') ?? ''

      // ── Standard whisper.cpp server: JSON response ─────────────────────
      if (contentType.includes('application/json')) {
        const json = await res.json() as { text?: string }
        const raw = (json.text ?? '').trim()
        if (!raw) {
          emitter.emit('error', new Error('whisper-server: empty transcript'))
          return
        }
        const full = postprocess(replacements.length ? applyReplacements(raw, replacements) : raw)
        emitter.emit('token', full)   // single token so HUD shows something
        emitter.emit('done', full)
        return
      }

      // ── Custom EC2 server: SSE streaming ───────────────────────────────
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE lines: split on double newline
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''  // last (possibly incomplete) chunk stays in buffer

        for (const event of events) {
          const line = event.trim()
          if (!line.startsWith('data: ')) continue

          let parsed: { text?: string; done?: boolean; full?: string; error?: string }
          try {
            parsed = JSON.parse(line.slice(6))
          } catch {
            console.warn('[transcribe-ec2] malformed SSE line:', line)
            continue
          }

          if (parsed.error) {
            throw new Error(`whisper-server SSE error: ${parsed.error}`)
          }

          if (parsed.done && parsed.full !== undefined) {
            const full = postprocess(
              replacements.length ? applyReplacements(parsed.full, replacements) : parsed.full
            )
            emitter.emit('done', full)
            return
          }

          if (parsed.text !== undefined) {
            accumulated += parsed.text
            tokenCount++
            emitter.emit('token', parsed.text)
          }
        }
      }

      // SSE stream closed without 'done' event
      if (tokenCount >= 5) {
        // Partial recovery: paste accumulated text, signal partial=true for amber HUD
        const full = postprocess(
          replacements.length ? applyReplacements(accumulated.trim(), replacements) : accumulated.trim()
        )
        emitter.emit('partial', full)
      } else {
        emitter.emit('error', new Error('SSE stream closed without completion'))
      }
    } catch (err) {
      emitter.emit('error', err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return emitter
}
