import type { Paster } from './types'
import { axPaster } from './ax'
import { iterm2Paster } from './iterm2'

// Registry: app name (from System Events) → Paster
// Only add entries here when an app needs something OTHER than Edit > Paste via menu.
// Most apps (Cursor, Obsidian, Chrome, Messages, etc.) work fine with axPaster.
const registry: Record<string, Paster> = {
  'iTerm2': iterm2Paster,
}

export function getPaster(appName: string): Paster {
  return registry[appName] ?? axPaster
}
