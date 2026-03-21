// Messages.app paster.
// Clicking the Edit > Paste menu item directly via System Events UI scripting
// is more reliable than keyboard injection for sandboxed apps.
// Requires Aurora (Electron) to have Accessibility permission — which it does.
import { execSync } from 'child_process'
import type { Paster } from './types'

export const messagesPaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "Messages" to activate
      delay 0.15
      tell application "System Events"
        tell process "Messages"
          click menu item "Paste" of menu 1 of menu bar item "Edit" of menu bar 1
        end tell
      end tell
    '`)
  },
}
