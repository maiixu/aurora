import type { Paster } from './types'
import { axPaster } from './ax'
import { iterm2Paster } from './iterm2'
import { messagesPaster } from './messages'
import { obsidianPaster } from './obsidian'
import { cursorPaster } from './cursor'
import { chromePaster } from './chrome'

// Registry: app name (from System Events) → Paster
// Add new entries here when an app needs custom paste behaviour.
const registry: Record<string, Paster> = {
  'iTerm2':         iterm2Paster,
  'Messages':       messagesPaster,
  'Obsidian':       obsidianPaster,
  'Cursor':         cursorPaster,
  'Google Chrome':  chromePaster,
}

export function getPaster(appName: string): Paster {
  return registry[appName] ?? axPaster
}
