import { app } from 'electron'
import { createTray } from './tray'
import { createHudWindow } from './hud-window'
import { registerIpcHandlers, wireStateMachineToIpc } from './ipc-handlers'
import { fsm } from './state-machine'
import { startHotkey, stopHotkey } from './hotkey'
import { createChatGptWindow, showChatGptForLogin, getChatGptWindow } from './chatgpt-window'
import { probeSelectors, dumpButtons } from './chatgpt-controller'
import { ensureMicrophoneAccess } from './permissions'
import { AppState } from '../shared/types'

// Remote debugging in dev — lets us inspect hidden windows via chrome://inspect
if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
}

// Hide from Dock — menu bar only app
app.dock?.hide()

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(() => {
  createHudWindow()
  createChatGptWindow()
  probeSelectors()
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
  }, showChatGptForLogin, () => {
    const win = getChatGptWindow()
    if (win) {
      win.show()
      win.webContents.openDevTools({ mode: 'detach' })
    }
  }, () => dumpButtons().catch(console.error))

  // Request mic access on first launch (non-blocking — hotkey still works,
  // voice meter in HUD will simply show idle pulse until access is granted)
  ensureMicrophoneAccess().then(granted => {
    if (!granted) console.warn('[aurora] microphone access not granted')
  })

  startHotkey()
  console.log('[aurora] ready — menu bar icon active')

  // Auto-test: trigger LISTENING → PROCESSING to verify ChatGPT voice flow
  if (process.env.TEST_VOICE === '1') {
    const { getChatGptWindow } = require('./chatgpt-window') as typeof import('./chatgpt-window')
    console.log('[test] will run textarea injection test in 8s...')
    setTimeout(async () => {
      const win = getChatGptWindow()
      if (!win || win.isDestroyed()) return

      // Inject fake transcript directly into #prompt-textarea to test polling
      const injected = await win.webContents.executeJavaScript(`
        (() => {
          const el = document.querySelector('#prompt-textarea') ||
                     document.querySelector('[contenteditable="true"]')
          if (!el) return 'element not found'
          el.textContent = 'hello this is a test transcript'
          el.dispatchEvent(new Event('input', { bubbles: true }))
          return 'injected: ' + (el.textContent || el.value)
        })()
      `)
      console.log('[test] textarea injection result:', injected)

      // Now trigger PROCESSING to start polling
      fsm.startListening()
      setTimeout(() => fsm.stopListening(), 500)
    }, 8000)
  }
})

app.on('will-quit', () => {
  stopHotkey()
})

app.on('window-all-closed', () => {
  // Keep running even with no visible windows — it's a menu bar app
})
