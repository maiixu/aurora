import { EventEmitter } from 'events'
import { loadDictionary, applyReplacements } from './dictionary'
import { postprocess } from './postprocess'

export function transcribeWithOpenAI(wavBuffer: Buffer, apiKey: string): EventEmitter {
  const emitter = new EventEmitter()
  const { prompt, replacements } = loadDictionary()

  ;(async () => {
    try {
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
        'Content-Disposition: form-data; name="model"',
        '', 'whisper-1',
        `--${boundary}`,
        'Content-Disposition: form-data; name="response_format"',
        '', 'json',
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

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(`OpenAI Whisper API ${res.status}: ${msg}`)
      }

      const json = await res.json() as { text?: string; error?: { message: string } }

      if (json.error) {
        throw new Error(`OpenAI Whisper API error: ${json.error.message}`)
      }

      const raw = (json.text ?? '').trim()
      if (!raw) {
        emitter.emit('error', new Error('OpenAI Whisper: empty transcript'))
        return
      }

      const full = postprocess(replacements.length ? applyReplacements(raw, replacements) : raw)
      emitter.emit('token', full)
      emitter.emit('done', full)
    } catch (err) {
      emitter.emit('error', err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return emitter
}
