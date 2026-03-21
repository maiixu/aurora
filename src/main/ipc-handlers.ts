import { ipcMain, clipboard } from 'electron'
import { IPC, AppState } from '../shared/types'
import { fsm } from './state-machine'
import { getHudWindow, showHud, hideHud } from './hud-window'

export function registerIpcHandlers() {
  // HUD renderer signals it has loaded
  ipcMain.on(IPC.HUD_READY, () => {
    console.log('[ipc] HUD ready')
  })

  // ChatGPT preload
  ipcMain.on(IPC.CHATGPT_TEXT, (_event, { text }: { text: string }) => {
    clipboard.writeText(text)
    fsm.textReceived(text)
  })

  ipcMain.on(IPC.CHATGPT_ERROR, (_event, { message }: { message: string }) => {
    console.error('[chatgpt] error:', message)
    fsm.cancel()
  })
}

export function broadcastState(state: AppState) {
  const win = getHudWindow()
  if (!win) return

  if (state === AppState.IDLE) {
    // Delay hiding slightly to let the fade-out animation play
    setTimeout(() => hideHud(), 50)
  } else {
    showHud()
    win.webContents.send(IPC.HUD_SET_STATE, { state })
  }
}

export function wireStateMachineToIpc() {
  fsm.on('stateChange', ({ to }: { from: AppState; to: AppState }) => {
    broadcastState(to)

    // SpeechRecognition start/stop is driven by the HUD renderer itself
  })
}
