export enum AppState {
  IDLE       = 'IDLE',
  LISTENING  = 'LISTENING',
  PROCESSING = 'PROCESSING',
  READY      = 'READY',
  CANCELLED  = 'CANCELLED',
}

export const IPC = {
  // main → hud
  HUD_SET_STATE:  'hud:setState',
  HUD_SET_VOLUME: 'hud:setVolume',
  // hud → main
  HUD_READY:      'hud:ready',
  // chatgpt → main (via preload)
  CHATGPT_TEXT:   'chatgpt:transcription',
  CHATGPT_ERROR:  'chatgpt:error',
} as const

export interface HudStatePayload  { state: AppState }
export interface HudVolumePayload { level: number }
export interface ChatGptTextPayload  { text: string }
export interface ChatGptErrorPayload { message: string }
