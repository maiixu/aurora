import { execSync } from 'child_process'
import type { Paster } from './types'

export const obsidianPaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '
      tell application "Obsidian" to activate
      delay 0.15
      tell application "System Events"
        tell process "Obsidian"
          keystroke "v" using command down
        end tell
      end tell
    '`)
  },
}
