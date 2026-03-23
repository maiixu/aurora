// iTerm2 intercepts simulated Cmd+V, so write text directly to the active session.
// We write text to a UTF-8 temp file and read it via AppleScript's `read file`
// to avoid MacRoman encoding corruption from `do shell script "pbpaste"`.
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import type { Paster } from './types'

export const iterm2Paster: Paster = {
  paste(text: string, _appName: string) {
    const tmp = `/tmp/aurora_paste_${Date.now()}.txt`
    writeFileSync(tmp, text, 'utf-8')
    try {
      execSync(`osascript -e '
        set f to open for access POSIX file "${tmp}"
        set t to read f as «class utf8»
        close access f
        tell app "iTerm2" to tell current session of current window to write text t newline NO
      '`)
    } finally {
      unlinkSync(tmp)
    }
  },
}
