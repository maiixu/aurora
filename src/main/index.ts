import { app } from 'electron'
import { createTray } from './tray'
import { createHudWindow } from './hud-window'
import { registerIpcHandlers, wireStateMachineToIpc } from './ipc-handlers'
import { fsm } from './state-machine'
import { startHotkey, stopHotkey } from './hotkey'
import { AppState } from '../shared/types'

// Hide from Dock — menu bar only app
app.dock?.hide()

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(() => {
  createHudWindow()
  registerIpcHandlers()
  wireStateMachineToIpc()

  createTray((debugState) => {
    switch (debugState as AppState) {
      case AppState.LISTENING:  fsm.startListening(); break
      case AppState.PROCESSING: fsm.stopListening(); break
      case AppState.READY:      fsm.textReceived('Hello from Aurora debug'); break
      case AppState.CANCELLED:  fsm.cancel(); break
      case AppState.IDLE:       /* auto transitions handle this */ break
    }
  })

  startHotkey()
  console.log('[aurora] ready — menu bar icon active')
})

app.on('will-quit', () => {
  stopHotkey()
})

app.on('window-all-closed', () => {
  // Keep running even with no visible windows — it's a menu bar app
})
