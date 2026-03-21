// Chrome paster: click Edit > Paste via menu rather than synthetic keystroke.
// Chrome's web input fields handle menu-driven paste more reliably than
// keystroke injection, for the same reason as Messages (sandboxed/JS-heavy inputs).
import { execSync } from 'child_process'
import type { Paster } from './types'

export const chromePaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "Google Chrome" to activate
      delay 0.15
      tell application "System Events"
        tell process "Google Chrome"
          click menu item "Paste" of menu 1 of menu bar item "Edit" of menu bar 1
        end tell
      end tell
    '`)
  },
}
