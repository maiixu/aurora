export enum AppState {
  IDLE       = 'IDLE',
  LISTENING  = 'LISTENING',
  PROCESSING = 'PROCESSING',
  READY      = 'READY',
  CANCELLED  = 'CANCELLED',
}

export const IPC = {
  HUD_SET_STATE:  'hud:setState',
  HUD_SET_VOLUME: 'hud:setVolume',
  HUD_READY:      'hud:ready',
  SPEECH_AUDIO:   'speech:audio',
} as const

export interface HudStatePayload  { state: AppState }
