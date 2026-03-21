import { ipcMain, clipboard } from 'electron'
import { getCapturedFrontApp } from './hotkey'
import { getPaster } from './pasters'
import { IPC, AppState } from '../shared/types'
import { fsm } from './state-machine'
import { getHudWindow, showHud, hideHud } from './hud-window'
import { getTrayAnimator } from './tray'
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
            getPaster(target).paste(text)
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
  getTrayAnimator()?.setState(state)

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
