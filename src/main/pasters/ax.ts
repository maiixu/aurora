// Default paster: keystroke Cmd+V to the frontmost process via System Events.
// Works for any app with standard clipboard support.
// Aurora must have Accessibility permission (System Settings → Privacy → Accessibility).
import { execSync } from 'child_process'
import type { Paster } from './types'

export const axPaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "System Events"
        tell (first process whose frontmost is true)
          keystroke "v" using command down
        end tell
      end tell
    '`)
  },
}
