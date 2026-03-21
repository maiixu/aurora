import {
  CHATGPT_VOICE_START_SELECTORS,
  CHATGPT_VOICE_STOP_SELECTORS,
  CHATGPT_TEXTAREA_SELECTORS,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
} from '../shared/constants'
import { getChatGptWindow } from './chatgpt-window'
import { fsm } from './state-machine'

// Build a JS snippet that tries selectors in order and returns truthy on success
function clickScript(selectors: string[]): string {
  const tries = selectors.map(s => `document.querySelector(${JSON.stringify(s)})`).join(' || ')
  return `
    (() => {
      const el = ${tries}
      if (el) { el.click(); return true }
      return false
    })()
  `
}

function readTextScript(selectors: string[]): string {
  const tries = selectors
    .map(s => `document.querySelector(${JSON.stringify(s)})`)
    .join(' || ')
  return `
    (() => {
      const el = ${tries}
      if (!el) return null
      const val = el.value || el.textContent || ''
      return val.trim() || null
    })()
  `
}

function clearTextScript(selectors: string[]): string {
  const tries = selectors
    .map(s => `document.querySelector(${JSON.stringify(s)})`)
    .join(' || ')
  return `
    (() => {
      const el = ${tries}
      if (!el) return
      if ('value' in el) el.value = ''
      else el.textContent = ''
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })()
  `
}

async function exec(script: string): Promise<unknown> {
  const win = getChatGptWindow()
  if (!win) return null
  return win.webContents.executeJavaScript(script)
}

/** Click the "start voice input" button. */
export async function startVoiceInput(): Promise<boolean> {
  const ok = await exec(clickScript(CHATGPT_VOICE_START_SELECTORS))
  if (!ok) console.warn('[chatgpt] start voice: no matching selector found')
  return !!ok
}

/** Click the "stop voice input" button and begin polling for text. */
export async function stopVoiceInput(): Promise<void> {
  await exec(clickScript(CHATGPT_VOICE_STOP_SELECTORS))
  pollForTranscription()
}

function pollForTranscription() {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  const script = readTextScript(CHATGPT_TEXTAREA_SELECTORS)

  const tick = async () => {
    if (Date.now() > deadline) {
      console.warn('[chatgpt] transcription timeout')
      fsm.timeout()
      return
    }

    const text = await exec(script)
    if (text && typeof text === 'string' && text.length > 0) {
      // Clear the textarea so it's ready for next use
      await exec(clearTextScript(CHATGPT_TEXTAREA_SELECTORS))
      fsm.textReceived(text)
    } else {
      setTimeout(tick, POLL_INTERVAL_MS)
    }
  }

  setTimeout(tick, POLL_INTERVAL_MS)
}

/** Probe selectors on startup — logs a warning if none are found. */
export async function probeSelectors(): Promise<void> {
  const win = getChatGptWindow()
  if (!win) return

  // Wait for chatgpt.com to load
  win.webContents.once('did-finish-load', async () => {
    const startOk = await exec(
      `!!(${CHATGPT_VOICE_START_SELECTORS.map(s => `document.querySelector(${JSON.stringify(s)})`).join(' || ')})`
    )
    if (!startOk) {
      console.warn('[chatgpt] ⚠ No voice start selector matched — ChatGPT DOM may have changed')
    } else {
      console.log('[chatgpt] voice selectors OK')
    }
  })
}
