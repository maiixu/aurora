// HUD window dimensions
export const HUD_WIDTH  = 20
export const HUD_HEIGHT = 20
export const HUD_CORNER_MARGIN = 24  // px from screen bottom-right corner

// Animation timings (ms)
export const ANIM_READY_DISPLAY    = 1200
export const ANIM_CANCELLED_DISPLAY = 800

// Hotkey (uiohook-napi key code)
// Dictation key → f5 → Karabiner complex_mod (to_if_held_down 400ms) → right_option
// right_option = 3640; terminal produces no visible output for modifier keys
export const DEFAULT_HOTKEY_CODE = 3640
export const LONG_PRESS_THRESHOLD_MS = 50  // Karabiner already enforces 400ms hold
