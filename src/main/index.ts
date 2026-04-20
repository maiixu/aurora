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
import { startWhisperTunnel, stopWhisperTunnel, isTunnelConnected } from './whisper-tunnel'
import { startLocalWhisper, stopLocalWhisper, localEvents, isSetupComplete } from './whisper-local'
import { readConfig } from './aurora-config'
import { updateTrayMenu } from './tray'
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

  const cfg = readConfig()

  if (cfg.backend === 'local') {
    startLocalWhisper()
  } else if (cfg.backend !== 'openai') {
    // 'ec2' or 'auto': start EC2 tunnel
    startWhisperTunnel()

    if (cfg.backend === 'auto' && isSetupComplete()) {
      // Auto-fallback: if EC2 not connected after 6s, start local whisper
      setTimeout(() => {
        if (!isTunnelConnected()) {
          console.log('[backend] EC2 unavailable, falling back to local whisper')
          startLocalWhisper()
        }
      }, 6000)
    }
  }

  // Refresh tray whenever local whisper state changes
  localEvents.on('stateChange', () => updateTrayMenu())

  startHotkey()
  console.log('[aurora] ready')
})

app.on('will-quit', () => {
  stopHotkey()
  stopWhisperTunnel()
  stopLocalWhisper()
})

app.on('window-all-closed', () => {
  // Keep running — menu bar app
})
