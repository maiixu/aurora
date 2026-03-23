# Aurora TODOs

Items considered and explicitly deferred. Each has enough context to pick up later.

---

## Per-app paste strategy (background paste without focus change)

**Problem:** The default paster (`ax.ts`) uses `tell (first process whose frontmost is true)` which pastes into whatever app is currently focused. If the user switches apps during transcription, the text lands in the wrong app.

**What was tried:**
- `tell application "${appName}" to activate` then Edit > Paste: disruptive (brings app to front, breaks WeChat whose process name ≠ app name)
- `tell process "${appName}" to keystroke "v"`: background keystroke doesn't work for Electron apps (Cursor, Obsidian)

**Likely solution:** No universal fix. Each app needs its own paster, similar to `iterm2.ts` which uses `tell current session to write text` — a direct API that doesn't require focus.

Priority apps to add:
- `WeChat` / `微信` — direct write to input field via Accessibility API?
- `Obsidian` — Electron, might need a different approach
- Generic fallback: activate app → paste → restore previous app focus?

**Current state:** Reverted to original `frontmost` behavior. Works perfectly when user stays in the target app; breaks when they switch away during transcription.

