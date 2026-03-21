import { uIOhook, UiohookKey } from 'uiohook-napi'
import { globalShortcut } from 'electron'
import { fsm } from './state-machine'
import { AppState } from '../shared/types'
import { DEFAULT_HOTKEY_CODE, LONG_PRESS_THRESHOLD_MS } from '../shared/constants'

// Escape key cancels LISTENING or PROCESSING
const ESC_CODE = UiohookKey.Escape

let pressStart: number | null = null
let longPressTimer: NodeJS.Timeout | null = null
let escRegistered = false

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
    if (pressStart !== null) return  // key repeat — ignore

    pressStart = Date.now()
    longPressTimer = setTimeout(() => {
      if (fsm.state === AppState.IDLE) {
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
