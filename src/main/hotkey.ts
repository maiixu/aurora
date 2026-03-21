import { uIOhook, UiohookKey } from 'uiohook-napi'
import { globalShortcut } from 'electron'
import { execSync } from 'child_process'
import { fsm } from './state-machine'
import { AppState } from '../shared/types'
import { DEFAULT_HOTKEY_CODE } from '../shared/constants'

export function getFrontApp(): string {
  try {
    return execSync(
      `osascript -e 'tell app "System Events" to get name of first process whose frontmost is true'`
    ).toString().trim()
  } catch { return '' }
}

let escRegistered = false
let capturedFrontApp = ''
export function getCapturedFrontApp() { return capturedFrontApp }

// Debounce: ignore key-repeat events while held
let ignoreUntil = 0

function registerEsc() {
  if (escRegistered) return
  globalShortcut.register('Escape', () => {
    const s = fsm.state
    if (s === AppState.LISTENING || s === AppState.PROCESSING) fsm.cancel()
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
    const now = Date.now()
    if (now < ignoreUntil) return   // swallow key-repeat while held
    ignoreUntil = now + 300

    if (fsm.state === AppState.IDLE) {
      capturedFrontApp = getFrontApp()
      fsm.startListening()
      registerEsc()
    } else if (fsm.state === AppState.LISTENING) {
      fsm.stopListening()   // → PROCESSING
      unregisterEsc()
      registerEsc()         // keep Esc active during PROCESSING
    }
    // PROCESSING / READY / CANCELLED: ignore extra presses
  })

  uIOhook.start()
  console.log(`[hotkey] listening for keycode ${keyCode} (toggle mode)`)
}

export function stopHotkey() {
  uIOhook.stop()
  unregisterEsc()
}
