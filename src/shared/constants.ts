// HUD window dimensions
export const HUD_WIDTH  = 280
export const HUD_HEIGHT = 72
export const HUD_BOTTOM_OFFSET = 100  // px from screen bottom

// Animation timings (ms)
export const ANIM_READY_DISPLAY    = 1200
export const ANIM_CANCELLED_DISPLAY = 800

// Hotkey (uiohook-napi key code)
// F5 = 63 (fn+F5 on MacBook, plain F5 on external keyboard)
export const DEFAULT_HOTKEY_CODE = 63
export const LONG_PRESS_THRESHOLD_MS = 150

// ChatGPT voice input selectors (tried in order)
// "Dictate button" confirmed from live DOM dump 2026-03-21
export const CHATGPT_VOICE_START_SELECTORS = [
  'button[aria-label="Dictate button"]',
  'button[aria-label="Start Voice"]',
  'button[aria-label="Start voice input"]',
  'button[data-testid="composer-speech-button"]',
]

export const CHATGPT_VOICE_STOP_SELECTORS = [
  'button[aria-label="Stop dictation"]',   // confirmed from live DOM 2026-03-21
  'button[aria-label="Submit dictation"]',  // alternative: submit immediately
  'button[aria-label="Stop dictating"]',
  'button[aria-label="Done dictating"]',
  'button[aria-label="Stop Voice"]',
  'button[aria-label="Stop voice input"]',
  'button[data-testid="composer-speech-stop"]',
]

export const CHATGPT_TEXTAREA_SELECTORS = [
  '#prompt-textarea',                          // ProseMirror contenteditable (confirmed)
  'div[contenteditable="true"][data-placeholder]',
  'textarea[name="prompt-textarea"]',          // fallback textarea
  'textarea[data-id="root"]',
]

// Transcription polling
export const POLL_INTERVAL_MS  = 300
export const POLL_TIMEOUT_MS   = 15_000
