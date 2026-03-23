// HUD window dimensions
export const HUD_WIDTH  = 20
export const HUD_HEIGHT = 20
export const HUD_CORNER_MARGIN = 24  // px from screen bottom-right corner

// Animation timings (ms)
export const ANIM_READY_DISPLAY    = 1200
export const ANIM_CANCELLED_DISPLAY = 800

// TRANSCRIBING panel layout
export const TRANSCRIBING_LINE_HEIGHT = 18   // px per text line
export const TRANSCRIBING_PADDING_V   = 8    // vertical padding (top + bottom) per side
export const TRANSCRIBING_MIN_DOT     = 22   // dot size in TRANSCRIBING state (px)

// Hotkey: Dictation key → f5 → Karabiner complex_mod → Hyper+F13 → Electron globalShortcut
// Hyper = Cmd+Ctrl+Alt+Shift; modifier combos are consumed by globalShortcut, no terminal output
