import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

contextBridge.exposeInMainWorld('auroraGpt', {
  sendTranscription: (text: string) => ipcRenderer.send(IPC.CHATGPT_TEXT, { text }),
  sendError: (message: string) => ipcRenderer.send(IPC.CHATGPT_ERROR, { message }),
})

// Override getUserMedia in the page context to prefer the built-in mic over
// external devices (webcams, virtual audio, etc.). ChatGPT calls getUserMedia
// without a deviceId so it defaults to whatever macOS has set as default.
// This intercept picks the first device whose label contains "built-in" or
// "macbook", falling back to the default if none match.
;(async () => {
  const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (!constraints?.audio) return orig(constraints)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const builtIn = devices.find(d =>
        d.kind === 'audioinput' &&
        /built.?in|macbook|internal/i.test(d.label)
      )
      if (builtIn) {
        const audioConstraints = typeof constraints.audio === 'object'
          ? { ...constraints.audio, deviceId: { exact: builtIn.deviceId } }
          : { deviceId: { exact: builtIn.deviceId } }
        console.log('[aurora] using built-in mic:', builtIn.label)
        return orig({ ...constraints, audio: audioConstraints })
      }
    } catch {
      // fall through to default
    }
    return orig(constraints)
  }
})()
