import { app, session } from 'electron'
import { createTray } from './tray'
import { createHudWindow } from './hud-window'
import { registerIpcHandlers, wireStateMachineToIpc } from './ipc-handlers'
import { fsm } from './state-machine'
import { startHotkey, stopHotkey } from './hotkey'
import { ensureMicrophoneAccess } from './permissions'
import { startWhisperTunnel, stopWhisperTunnel } from './whisper-tunnel'
import { AppState } from '../shared/types'

if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
  app.commandLine.appendSwitch('remote-allow-origins', '*')
}

app.dock?.hide()

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media')
  })

  createHudWindow()
  registerIpcHandlers()
  wireStateMachineToIpc()

  createTray((debugState) => {
    switch (debugState as AppState) {
      case AppState.LISTENING:  fsm.startListening(); break
      case AppState.PROCESSING: fsm.stopListening(); break
      case AppState.READY:      fsm.textReceived('Aurora debug'); break
      case AppState.CANCELLED:  fsm.cancel(); break
    }
  })

  ensureMicrophoneAccess().then(granted => {
    if (!granted) console.warn('[aurora] microphone access not granted')
  })

  startWhisperTunnel()
  startHotkey()
  console.log('[aurora] ready')
})

app.on('will-quit', () => {
  stopHotkey()
  stopWhisperTunnel()
})

app.on('window-all-closed', () => {
  // Keep running — menu bar app
})
