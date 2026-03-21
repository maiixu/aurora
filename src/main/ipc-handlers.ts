import { ipcMain, clipboard } from 'electron'
import { execSync } from 'child_process'
import { join } from 'path'
import { getCapturedFrontApp } from './hotkey'
import { IPC, AppState } from '../shared/types'
import { fsm } from './state-machine'
import { getHudWindow, showHud, hideHud } from './hud-window'
import { transcribe } from './transcriber'

export function registerIpcHandlers() {
  ipcMain.on(IPC.HUD_READY, () => {
    console.log('[ipc] HUD ready')
  })

  // HUD renderer sends WAV audio after recording stops
  ipcMain.on(IPC.SPEECH_AUDIO, (_event, audio: Buffer) => {
    const buf = Buffer.isBuffer(audio) ? audio : Buffer.from(audio)
    console.log('[ipc] received audio', buf.length, 'bytes')
    transcribe(buf)
      .then((text) => {
        if (!text) {
          console.warn('[transcriber] empty transcript')
          fsm.cancel()
          return
        }
        console.log('[transcriber] transcript:', text)
        clipboard.writeText(text)
        fsm.textReceived(text)
        const target = getCapturedFrontApp()
        console.log('[paste] target app:', target)
        setTimeout(() => {
          try {
            if (target === 'iTerm2') {
              // iTerm2 intercepts simulated Cmd+V — write directly to the session
              execSync(`osascript -e 'tell app "iTerm2" to tell current session of current window to write text (do shell script "pbpaste") newline NO'`)
            } else {
              // Use CGEventPost (paste-helper) to inject Cmd+V at the HID stream level.
              // This bypasses the Accessibility API and works for sandboxed apps like Messages.
              const helperPath = join(__dirname, '../../paste-helper')
              execSync(helperPath)
            }
            console.log('[paste] done')
          } catch (e) {
            console.error('[paste] error:', e)
          }
        }, 200)
      })
      .catch((err) => {
        console.error('[transcriber] error:', err)
        fsm.cancel()
      })
  })
}

export function broadcastState(state: AppState) {
  const win = getHudWindow()
  if (!win) return

  if (state === AppState.IDLE) {
    setTimeout(() => hideHud(), 50)
  } else {
    showHud()
    win.webContents.send(IPC.HUD_SET_STATE, { state })
  }
}

export function wireStateMachineToIpc() {
  fsm.on('stateChange', ({ to }: { from: AppState; to: AppState }) => {
    broadcastState(to)
    // Recording is driven by the HUD renderer reacting to state changes.
    // Main process just needs to handle SPEECH_AUDIO when it arrives.
  })
}
