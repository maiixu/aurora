// Default paster: uses paste-helper binary (AXUIElement kAXSelectedTextAttribute,
// falls back to CGEventPost Cmd+V internally).
// Works for most apps. Requires paste-helper in System Settings → Accessibility.
import { execSync } from 'child_process'
import { join } from 'path'
import type { Paster } from './types'

export const axPaster: Paster = {
  paste(_text: string) {
    const bin = join(__dirname, '../../../paste-helper')
    execSync(bin)
  },
}
