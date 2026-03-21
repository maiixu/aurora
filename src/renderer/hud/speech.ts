// Uses Chromium's built-in SpeechRecognition (no ChatGPT DOM needed).
// Starts on LISTENING, stops on PROCESSING, sends transcript to main via IPC.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySR = any

export function createSpeechRecognizer(onResult: (text: string) => void, onError: (msg: string) => void) {
  const SR: AnySR = (window as AnySR).SpeechRecognition || (window as AnySR).webkitSpeechRecognition
  if (!SR) {
    onError('SpeechRecognition not available')
    return null
  }

  const rec: AnySR = new SR()
  rec.continuous = true
  rec.interimResults = false
  rec.lang = navigator.language || 'en-US'

  rec.onresult = (e: AnySR) => {
    const transcript = Array.from(e.results as AnySR[])
      .map((r: AnySR) => r[0].transcript as string)
      .join('')
      .trim()
    if (transcript) onResult(transcript)
  }

  rec.onerror = (e: AnySR) => {
    if (e.error !== 'aborted' && e.error !== 'no-speech') {
      onError(e.error as string)
    }
  }

  return {
    start() { try { rec.start() } catch {} },
    stop()  { try { rec.stop()  } catch {} },
    abort() { try { rec.abort() } catch {} },
  }
}
