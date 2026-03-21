import { execSync } from 'child_process'
import type { Paster } from './types'

export const obsidianPaster: Paster = {
  paste(_text: string) {
    // Obsidian's CodeMirror editor doesn't reliably accept simulated Cmd+V.
    // Instead, use the Accessibility API to set AXSelectedText on the focused
    // UI element — this inserts text at the cursor without keyboard simulation.
    execSync(`osascript -e '
      tell application "Obsidian" to activate
      delay 0.15
      tell application "System Events"
        tell process "Obsidian"
          click menu item "Paste" of menu 1 of menu bar item "Edit" of menu bar 1
        end tell
      end tell
    '`)
  },
}
