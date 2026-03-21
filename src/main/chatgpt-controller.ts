import {
  CHATGPT_VOICE_START_SELECTORS,
  CHATGPT_VOICE_STOP_SELECTORS,
  CHATGPT_TEXTAREA_SELECTORS,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
} from '../shared/constants'
import { getChatGptWindow } from './chatgpt-window'
import { fsm } from './state-machine'

function clickScript(selectors: string[]): string {
  const tries = selectors.map(s => `document.querySelector(${JSON.stringify(s)})`).join(' || ')
  return `(() => { const el = ${tries}; if (el) { el.click(); return true } return false })()`
}

function readTextScript(selectors: string[]): string {
  const tries = selectors.map(s => `document.querySelector(${JSON.stringify(s)})`).join(' || ')
  return `
    (() => {
      const el = ${tries}
      if (!el) return null
      const val = el.value
        || el.innerText
        || el.textContent
        || Array.from(el.querySelectorAll('p')).map(p => p.textContent).join(' ')
        || ''
      return val.trim() || null
    })()`
}

function clearTextScript(selectors: string[]): string {
  const tries = selectors.map(s => `document.querySelector(${JSON.stringify(s)})`).join(' || ')
  return `
    (() => {
      const el = ${tries}
      if (!el) return
      if ('value' in el) el.value = ''
      else el.textContent = ''
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })()`
}

async function exec(script: string): Promise<unknown> {
  const win = getChatGptWindow()
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return null
  return win.webContents.executeJavaScript(script)
}

export async function startVoiceInput(): Promise<boolean> {
  const ok = await exec(clickScript(CHATGPT_VOICE_START_SELECTORS))
  console.log('[chatgpt] start voice click result:', ok)
  if (!ok) console.warn('[chatgpt] start voice: no matching selector found')
  return !!ok
}

export async function stopVoiceInput(): Promise<void> {
  // Try stop button (best-effort); also toggle Dictate button
  exec(clickScript(CHATGPT_VOICE_STOP_SELECTORS)).catch(() => {})
  exec(clickScript(CHATGPT_VOICE_START_SELECTORS)).catch(() => {})
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
      console.log('[chatgpt] transcript:', text)
      await exec(clearTextScript(CHATGPT_TEXTAREA_SELECTORS))
      fsm.textReceived(text)
    } else {
      setTimeout(tick, POLL_INTERVAL_MS)
    }
  }

  setTimeout(tick, POLL_INTERVAL_MS)
}

export async function probeSelectors(): Promise<void> {
  const win = getChatGptWindow()
  if (!win) return
  win.webContents.once('did-finish-load', async () => {
    await new Promise(r => setTimeout(r, 4000))
    if (win.isDestroyed()) return
    const ok = await exec(
      `!!(${CHATGPT_VOICE_START_SELECTORS.map(s =>
        `document.querySelector(${JSON.stringify(s)})`).join(' || ')})`
    )
    console.log(ok
      ? '[chatgpt] voice selectors OK'
      : '[chatgpt] ⚠ voice selector not found (user may not be logged in yet)')
  })
}
