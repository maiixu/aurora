import { app, session } from 'electron'

// Suppress EPIPE errors when stdout/stderr have no terminal (e.g. launched from Finder)
process.stdout.on('error', (e: NodeJS.ErrnoException) => { if (e.code !== 'EPIPE') throw e })
process.stderr.on('error', (e: NodeJS.ErrnoException) => { if (e.code !== 'EPIPE') throw e })
import { createTray } from './tray'
import { createHudWindow, watchScreenChanges } from './hud-window'
import { registerIpcHandlers, wireStateMachineToIpc } from './ipc-handlers'
import { fsm } from './state-machine'
import { startHotkey, stopHotkey } from './hotkey'
import { ensureMicrophoneAccess, ensureAccessibilityAccess } from './permissions'
import { startWhisperTunnel, stopWhisperTunnel } from './whisper-tunnel'
import { AppState } from '../shared/types'

if (process.env.NODE_ENV === 'development' && process.env.AURORA_DEVTOOLS) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
  app.commandLine.appendSwitch('remote-allow-origins', 'http://localhost:5173')
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(() => {

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media')
  })

  createHudWindow()
  watchScreenChanges()
  registerIpcHandlers()
  wireStateMachineToIpc()

  createTray()

  ensureMicrophoneAccess().then(granted => {
    if (!granted) console.warn('[aurora] microphone access not granted')
  })
  ensureAccessibilityAccess()

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
