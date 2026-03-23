import { globalShortcut } from 'electron'
import { execSync } from 'child_process'
import { fsm } from './state-machine'
import { AppState } from '../shared/types'

export function getFrontApp(): string {
  try {
    return execSync(
      `osascript -e 'tell app "System Events" to get name of first process whose frontmost is true'`
    ).toString().trim()
  } catch { return '' }
}

let capturedFrontApp = ''
export function getCapturedFrontApp() { return capturedFrontApp }

export function startHotkey(key = 'Cmd+Ctrl+Alt+Shift+F13') {
  const ok = globalShortcut.register(key, () => {
    if (fsm.state === AppState.IDLE) {
      capturedFrontApp = getFrontApp()
      fsm.startListening()
    } else if (fsm.state === AppState.LISTENING) {
      fsm.stopListening()   // → PROCESSING
    }
    // PROCESSING / TRANSCRIBING / READY / CANCELLED: ignore extra presses
  })
  if (!ok) {
    console.error(`[hotkey] failed to register ${key} — key may be in use by another app`)
  } else {
    console.log(`[hotkey] registered ${key} via globalShortcut (toggle mode)`)
  }
}

export function stopHotkey() {
  globalShortcut.unregisterAll()
}
