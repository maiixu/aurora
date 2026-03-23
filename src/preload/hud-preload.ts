import { contextBridge, ipcRenderer } from 'electron'
import { AppState, IPC, TranscriptionTokenEvent } from '../shared/types'

contextBridge.exposeInMainWorld('aurora', {
  onStateChange: (cb: (state: AppState) => void) => {
    ipcRenderer.on(IPC.HUD_SET_STATE, (_event, payload: { state: AppState }) => cb(payload.state))
  },
  onVolumeChange: (cb: (level: number) => void) => {
    ipcRenderer.on(IPC.HUD_SET_VOLUME, (_event, payload: { level: number }) => cb(payload.level))
  },
  onToken: (cb: (event: TranscriptionTokenEvent) => void) => {
    ipcRenderer.on(IPC.TRANSCRIPTION_TOKEN, (_event, payload: TranscriptionTokenEvent) => cb(payload))
  },
  ready:     () => ipcRenderer.send(IPC.HUD_READY),
  sendAudio: (audio: Uint8Array) => ipcRenderer.send(IPC.SPEECH_AUDIO, audio),
  sendText:  (text: string)    => ipcRenderer.send(IPC.SPEECH_TEXT,  { text }),
  sendError: (message: string) => ipcRenderer.send(IPC.SPEECH_ERROR, { message }),
})
