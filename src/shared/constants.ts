// HUD window dimensions
export const HUD_WIDTH  = 280
export const HUD_HEIGHT = 72
export const HUD_BOTTOM_OFFSET = 100  // px from screen bottom

// Animation timings (ms)
export const ANIM_READY_DISPLAY    = 1200
export const ANIM_CANCELLED_DISPLAY = 800

// Hotkey (uiohook-napi key code)
// Option key = 56 (left Alt on macOS)
export const DEFAULT_HOTKEY_CODE = 56
export const LONG_PRESS_THRESHOLD_MS = 150

// ChatGPT voice input selectors (tried in order)
export const CHATGPT_VOICE_START_SELECTORS = [
  'button[aria-label="Start voice input"]',
  'button[data-testid="composer-speech-button"]',
  'button[aria-label="Voice input"]',
]

export const CHATGPT_VOICE_STOP_SELECTORS = [
  'button[aria-label="Stop voice input"]',
  'button[data-testid="composer-speech-stop"]',
  'button[aria-label="Stop recording"]',
]

export const CHATGPT_TEXTAREA_SELECTORS = [
  '#prompt-textarea',
  'div[contenteditable="true"][data-placeholder]',
  'textarea[data-id="root"]',
]

// Transcription polling
export const POLL_INTERVAL_MS  = 300
export const POLL_TIMEOUT_MS   = 15_000
