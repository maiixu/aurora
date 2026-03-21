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
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return null
  return win.webContents.executeJavaScript(script)
}

/** Click the "start voice input" button. */
export async function startVoiceInput(): Promise<boolean> {
  // Clear any leftover text so poll doesn't pick up stale content
  await exec(clearTextScript(CHATGPT_TEXTAREA_SELECTORS))
  const ok = await exec(clickScript(CHATGPT_VOICE_START_SELECTORS))
  if (!ok) {
    console.warn('[chatgpt] start voice: no matching selector found')
  } else {
    // After click, dump buttons after 1s to discover the stop-button aria-label
    // Dump buttons 1s after click to see what state the Dictate button becomes
    setTimeout(async () => {
      const snapshot = await exec(`
        (() => Array.from(document.querySelectorAll('button'))
          .filter(b => b.getAttribute('aria-label'))
          .map(b => ({ label: b.getAttribute('aria-label'), cls: b.className?.toString().slice(0,60) }))
        )()
      `)
      console.log('[chatgpt] buttons after start-voice click:', JSON.stringify(snapshot))
    }, 1000)
  }
  return !!ok
}

/** Stop voice input and begin polling for transcribed text.
 *  ChatGPT Dictate auto-stops on silence, so the stop-button click is best-effort.
 *  We start polling immediately regardless. */
export async function stopVoiceInput(): Promise<void> {
  // Try stop button (works if ChatGPT is still in active-recording state)
  exec(clickScript(CHATGPT_VOICE_STOP_SELECTORS)).catch(() => {})
  // Also try clicking the Dictate button again as a toggle
  exec(clickScript(CHATGPT_VOICE_START_SELECTORS)).catch(() => {})
  // Poll immediately — don't wait for stop to succeed
  pollForTranscription()
}

function pollForTranscription() {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  const script = readTextScript(CHATGPT_TEXTAREA_SELECTORS)
  let pollCount = 0

  const tick = async () => {
    if (Date.now() > deadline) {
      console.warn('[chatgpt] transcription timeout after', pollCount, 'polls')
      fsm.timeout()
      return
    }

    const text = await exec(script)
    pollCount++
    if (pollCount === 1) {
      // First poll: also dump the textarea element structure to verify selector
      const debug = await exec(`
        (() => {
          const el = ${CHATGPT_TEXTAREA_SELECTORS.map(s => `document.querySelector(${JSON.stringify(s)})`).join(' || ')}
          if (!el) return { found: false }
          return {
            found: true, tag: el.tagName, id: el.id,
            contenteditable: el.getAttribute('contenteditable'),
            value: el.value ?? null,
            textContent: el.textContent?.slice(0, 100),
            innerHTML: el.innerHTML?.slice(0, 200),
          }
        })()
      `)
      console.log('[chatgpt] textarea debug:', JSON.stringify(debug))
    }
    if (pollCount <= 3 || pollCount % 5 === 0) {
      console.log(`[chatgpt] poll #${pollCount} textarea value:`, JSON.stringify(text))
    }

    if (text && typeof text === 'string' && text.length > 0) {
      console.log('[chatgpt] got transcript:', text)
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

  win.webContents.once('did-finish-load', () => {
    // Poll every 5s for up to 60s to catch login completing
    let attempts = 0
    const poll = async () => {
      if (win.isDestroyed()) return
      await new Promise(r => setTimeout(r, 5000))
      if (win.isDestroyed()) return
      await dumpButtons()
      attempts++
      if (attempts < 12) setTimeout(poll, 5000)
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
