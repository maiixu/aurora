import { ipcMain, clipboard } from 'electron'
import { getCapturedFrontApp } from './hotkey'
import { getPaster } from './pasters'
import { IPC, AppState, TranscriptionTokenEvent } from '../shared/types'
import { fsm } from './state-machine'
import { getHudWindow, showHud, hideHud, resizeForTranscribing, resizeForDot } from './hud-window'
import { getTrayAnimator, updateTrayMenu } from './tray'
import { transcribeWithEc2Whisper } from './transcribe-ec2'

export function registerIpcHandlers() {
  ipcMain.on(IPC.HUD_READY, () => {
    console.log('[ipc] HUD ready')
  })

  ipcMain.on(IPC.HUD_RESIZE, (_event, lines: number) => {
    resizeForTranscribing(lines)
  })

  // HUD renderer sends WAV audio after recording stops
  ipcMain.on(IPC.SPEECH_AUDIO, (_event, audio: Buffer) => {
    const buf = Buffer.isBuffer(audio) ? audio : Buffer.from(audio)
    console.log('[ipc] received audio', buf.length, 'bytes')

    const emitter = transcribeWithEc2Whisper(buf)

    // Transition to TRANSCRIBING as soon as the SSE connection is established
    // (first token or done event tells us inference has started)
    let transcribingStarted = false

    emitter.on('token', (text: string) => {
      if (!transcribingStarted) {
        transcribingStarted = true
        fsm.startTranscribing()
      }
      const win = getHudWindow()
      if (win) {
        const payload: TranscriptionTokenEvent = { type: 'token', text }
        win.webContents.send(IPC.TRANSCRIPTION_TOKEN, payload)
      }
    })

    emitter.on('done', (full: string) => {
      if (!full) {
        console.warn('[transcriber] empty transcript')
        fsm.cancel()
        return
      }
      console.log('[transcriber] transcript:', full)
      clipboard.writeText(full)
      fsm.textReceived(full)
      const target = getCapturedFrontApp()
      console.log('[paste] target app:', target)
      setTimeout(() => {
        try {
          getPaster(target).paste(full, target)
          console.log('[paste] done')
        } catch (e) {
          console.error('[paste] error:', e)
        }
      }, 200)
    })

    emitter.on('partial', (full: string) => {
      // Partial stream recovery (≥5 tokens, stream dropped): paste accumulated text + amber HUD
      console.warn('[transcriber] partial transcript, pasting:', full)
      clipboard.writeText(full)
      const win = getHudWindow()
      if (win) {
        win.webContents.send(IPC.TRANSCRIPTION_TOKEN, { type: 'partial', full } as TranscriptionTokenEvent)
      }
      // Signal renderer to show amber tint via setPartial before CANCELLED state
      fsm.cancel()
      const target = getCapturedFrontApp()
      setTimeout(() => {
        try {
          getPaster(target).paste(full, target)
        } catch (e) {
          console.error('[paste] error:', e)
        }
      }, 200)
    })

    emitter.on('error', (err: Error) => {
      console.error('[transcriber] error:', err)
      fsm.cancel()
    })
  })
}

export function broadcastState(state: AppState) {
  const win = getHudWindow()
  getTrayAnimator()?.setState(state)
  updateTrayMenu(state)

  if (!win) return

  if (state === AppState.IDLE) {
    resizeForDot()
    setTimeout(() => hideHud(), 50)
  } else if (state === AppState.TRANSCRIBING) {
    resizeForTranscribing()
    showHud()
    win.webContents.send(IPC.HUD_SET_STATE, { state })
  } else {
    if (state !== AppState.READY && state !== AppState.CANCELLED) {
      resizeForDot()
    }
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
