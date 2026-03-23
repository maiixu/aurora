import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_PATH = join(homedir(), '.aurora', 'config.json')

export type BackendMode = 'auto' | 'ec2' | 'local'

export interface AuroraConfig {
  backend: BackendMode
}

const DEFAULTS: AuroraConfig = { backend: 'auto' }

export function readConfig(): AuroraConfig {
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function writeConfig(patch: Partial<AuroraConfig>): void {
  try {
    mkdirSync(join(homedir(), '.aurora'), { recursive: true })
    writeFileSync(CONFIG_PATH, JSON.stringify({ ...readConfig(), ...patch }, null, 2))
  } catch (e) {
    console.error('[config] write failed:', e)
  }
}
