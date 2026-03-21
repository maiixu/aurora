import { uIOhook, UiohookKey } from 'uiohook-napi'
import { globalShortcut } from 'electron'
import { execSync } from 'child_process'
import { fsm } from './state-machine'
import { AppState } from '../shared/types'
import { DEFAULT_HOTKEY_CODE, LONG_PRESS_THRESHOLD_MS } from '../shared/constants'

function deleteInsertedSpaces(count: number) {
  console.log('[hotkey] deleting', count, 'space(s)')
  if (count <= 0) return
  try {
    execSync(`osascript -e 'tell app "System Events" to key code 51'`)
    console.log('[hotkey] backspace OK')
  } catch (e) {
    console.error('[hotkey] backspace failed:', e)
  }
}

export function getFrontApp(): string {
  try {
    return execSync(
      `osascript -e 'tell app "System Events" to get name of first process whose frontmost is true'`
    ).toString().trim()
  } catch { return '' }
}

// Escape key cancels LISTENING or PROCESSING
const ESC_CODE = UiohookKey.Escape

let pressStart: number | null = null
let longPressTimer: NodeJS.Timeout | null = null
let escRegistered = false
let spaceCount = 0  // keydown events received during hold (including key repeat)
let capturedFrontApp = ''
export function getCapturedFrontApp() { return capturedFrontApp }

function registerEsc() {
  if (escRegistered) return
  globalShortcut.register('Escape', () => {
    const s = fsm.state
    if (s === AppState.LISTENING || s === AppState.PROCESSING) {
      fsm.cancel()
    }
  })
  escRegistered = true
}

function unregisterEsc() {
  if (!escRegistered) return
  globalShortcut.unregister('Escape')
  escRegistered = false
}

export function startHotkey(keyCode = DEFAULT_HOTKEY_CODE) {
  uIOhook.on('keydown', (e) => {
    if (e.keycode !== keyCode) return
    if (pressStart !== null) {
      spaceCount++  // key repeat — count inserted characters
      return
    }

    pressStart = Date.now()
    spaceCount = 1
    longPressTimer = setTimeout(() => {
      if (fsm.state === AppState.IDLE) {
        capturedFrontApp = getFrontApp()
        fsm.startListening()
        registerEsc()
      }
    }, LONG_PRESS_THRESHOLD_MS)
  })

  uIOhook.on('keyup', (e) => {
    if (e.keycode !== keyCode) return
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    const held = pressStart !== null ? Date.now() - pressStart : 0
    pressStart = null

    if (held >= LONG_PRESS_THRESHOLD_MS && fsm.state === AppState.LISTENING) {
      deleteInsertedSpaces(spaceCount)  // key released — no more repeats, safe to delete all
      fsm.stopListening()  // → PROCESSING
      unregisterEsc()
      registerEsc()        // keep Esc active during PROCESSING too
    }
  })

  uIOhook.start()
  console.log(`[hotkey] listening for keycode ${keyCode} (long-press ≥${LONG_PRESS_THRESHOLD_MS}ms)`)
}

export function stopHotkey() {
  uIOhook.stop()
  unregisterEsc()
}
