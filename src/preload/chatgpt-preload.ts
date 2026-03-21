import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

contextBridge.exposeInMainWorld('auroraGpt', {
  sendTranscription: (text: string) => ipcRenderer.send(IPC.CHATGPT_TEXT, { text }),
  sendError: (message: string) => ipcRenderer.send(IPC.CHATGPT_ERROR, { message }),
})
