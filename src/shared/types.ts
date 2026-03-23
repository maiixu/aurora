export enum AppState {
  IDLE         = 'IDLE',
  LISTENING    = 'LISTENING',
  PROCESSING   = 'PROCESSING',
  TRANSCRIBING = 'TRANSCRIBING',
  READY        = 'READY',
  CANCELLED    = 'CANCELLED',
}

export const IPC = {
  HUD_SET_STATE:       'hud:setState',
  HUD_SET_VOLUME:      'hud:setVolume',
  HUD_READY:           'hud:ready',
  SPEECH_AUDIO:        'speech:audio',
  SPEECH_TEXT:         'speech:text',
  SPEECH_ERROR:        'speech:error',
  TRANSCRIPTION_TOKEN: 'transcription:token',
} as const

export interface HudStatePayload { state: AppState }

export type TranscriptionTokenEvent =
  | { type: 'token';   text: string }
  | { type: 'done';    full: string }
  | { type: 'partial'; full: string }   // stream dropped ≥5 tokens — amber HUD, still pastes
  | { type: 'error';   message: string }
