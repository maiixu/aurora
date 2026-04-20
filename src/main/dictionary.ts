import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface Dictionary {
  prompt: string
  replacements: Array<{ from: string; to: string }>
}

export function loadDictionary(): Dictionary {
  try {
    const raw = readFileSync(join(homedir(), '.aurora', 'dictionary.txt'), 'utf-8')
    const [promptSection, replaceSection] = raw.split(/^\[replace\]/m)

    const prompt = (promptSection ?? '').trim()

    const replacements = (replaceSection ?? '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.includes('='))
      .map(l => {
        const eq = l.indexOf('=')
        return { from: l.slice(0, eq).trim().toLowerCase(), to: l.slice(eq + 1).trim() }
      })

    return { prompt, replacements }
  } catch {
    return { prompt: '', replacements: [] }
  }
}

export function applyReplacements(text: string, replacements: Array<{ from: string; to: string }>): string {
  let result = text
  for (const { from, to } of replacements) {
    result = result.replace(new RegExp(`(?<![\\w])${escapeRegex(from)}(?![\\w])`, 'gi'), to)
  }
  return result
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
