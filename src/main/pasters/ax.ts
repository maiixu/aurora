// Default paster: click Edit > Paste via the frontmost process menu.
// More reliable than keystroke injection for Electron/web-based apps (Cursor, Obsidian, Chrome, etc.)
// Aurora must have Accessibility permission (System Settings → Privacy → Accessibility).
import { execSync } from 'child_process'
import type { Paster } from './types'

export const axPaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "System Events"
        tell (first process whose frontmost is true)
          click menu item "Paste" of menu 1 of menu bar item "Edit" of menu bar 1
        end tell
      end tell
    '`)
  },
}
