import { execSync } from 'child_process'
import type { Paster } from './types'

export const cursorPaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "Cursor" to activate
      delay 0.15
      tell application "System Events"
        tell process "Cursor"
          keystroke "v" using command down
        end tell
      end tell
    '`)
  },
}
