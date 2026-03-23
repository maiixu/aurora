// Default paster: click Edit > Paste via the frontmost process menu.
// More reliable than keystroke injection for Electron/web-based apps (Cursor, Obsidian, Chrome, etc.)
// Aurora must have Accessibility permission (System Settings → Privacy → Accessibility).
import { execSync } from 'child_process'
import type { Paster } from './types'

export const axPaster: Paster = {
  paste(_text: string, appName: string) {
    // Send Cmd+V directly to the target process without activating it.
    // Text is already in clipboard (written by ipc-handlers before this call).
    // This preserves the user's current focus — no app-switching disruption.
    execSync(`osascript -e '
      tell application "System Events"
        tell process "${appName}"
          keystroke "v" using {command down}
        end tell
      end tell
    '`)
  },
}
