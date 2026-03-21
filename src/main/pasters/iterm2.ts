// iTerm2 intercepts simulated Cmd+V, so write text directly to the active session.
import { execSync } from 'child_process'
import type { Paster } from './types'

export const iterm2Paster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e 'tell app "iTerm2" to tell current session of current window to write text (do shell script "pbpaste") newline NO'`)
  },
}
