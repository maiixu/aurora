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

/** Poll until logged-in ChatGPT composer is visible, then dump buttons. */
export async function probeSelectors(): Promise<void> {
  const win = getChatGptWindow()
  if (!win) return

  win.webContents.on('did-finish-load', () => {
    // Poll every 5s for up to 2 minutes — waits for user to be logged in
    let attempts = 0
    const poll = async () => {
      await new Promise(r => setTimeout(r, 5000))
      await dumpButtons()
      attempts++
      if (attempts < 24) setTimeout(poll, 5000)
    }
    poll()
  })
}

/** Dump all button aria-labels, data-testids, and SVG hints — run after page load to find voice button. */
export async function dumpButtons(): Promise<void> {
  const result = await exec(`
    (() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        ariaLabel: b.getAttribute('aria-label'),
        testId:    b.getAttribute('data-testid'),
        title:     b.getAttribute('title'),
        cls:       b.className?.toString().slice(0, 80),
        text:      b.innerText?.trim().slice(0, 40),
      })).filter(b => b.ariaLabel || b.testId || b.title)
    })()
  `)
  console.log('[chatgpt] buttons:', JSON.stringify(result, null, 2))
}
