import { execSync } from 'child_process'
import type { Paster } from './types'

export const chromePaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "Google Chrome" to activate
      delay 0.15
      tell application "System Events"
        tell process "Google Chrome"
          keystroke "v" using command down
        end tell
      end tell
    '`)
  },
}
