// Default paster: click Edit > Paste menu via UI scripting.
// Works for any app with a standard Edit menu, since Aurora itself is
// a trusted Accessibility client — no child process permission issue.
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
