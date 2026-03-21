import { app } from 'electron'
import { createTray } from './tray'
import { createHudWindow, showHud, hideHud } from './hud-window'

// Hide from Dock — menu bar only app
app.dock?.hide()

// Prevent multiple instances
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(() => {
  // Pre-create HUD at startup (avoids latency on hotkey press)
  createHudWindow()

  createTray((debugState) => {
    console.log('[debug] state triggered:', debugState)
    if (debugState === 'IDLE') {
      hideHud()
    } else {
      showHud()
    }
    // Will be fully wired to state machine in feat/state-machine
  })

  console.log('[aurora] ready — menu bar icon active')
})

app.on('window-all-closed', () => {
  // Keep running even with no windows — it's a menu bar app
})
