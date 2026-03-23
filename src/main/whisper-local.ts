import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import * as net from 'net'
import { EventEmitter } from 'events'

export const LOCAL_PORT = 18080

// Binary search order: homebrew first, then source build
const BINARY_CANDIDATES = [
  '/opt/homebrew/bin/whisper-server',
  '/usr/local/bin/whisper-server',
  join(homedir(), 'code', 'whisper.cpp', 'build', 'bin', 'whisper-server'),
]

const MODELS_DIR = join(homedir(), '.aurora', 'models')

// Prefer turbo (smaller + fast), fall back to large-v3
const MODEL_PRIORITY = [
  'ggml-large-v3-turbo.bin',
  'ggml-large-v3.bin',
  'ggml-large-v3-turbo-q5_0.bin',
]

export type LocalState = 'stopped' | 'loading' | 'ready' | 'error'

export const localEvents = new EventEmitter()

let state: LocalState = 'stopped'
let proc: ChildProcess | null = null

export function getLocalState(): LocalState { return state }

export function findBinary(): string | null {
  return BINARY_CANDIDATES.find(p => existsSync(p)) ?? null
}

export function findModel(): string | null {
  for (const name of MODEL_PRIORITY) {
    const p = join(MODELS_DIR, name)
    if (existsSync(p)) return p
  }
  return null
}

export function activeModelName(): string | null {
  const p = findModel()
  if (!p) return null
  const name = p.split('/').pop()!
  if (name.includes('turbo')) return 'turbo'
  if (name.includes('large-v3')) return 'large-v3'
  return name
}

export function isSetupComplete(): boolean {
  return findBinary() !== null && findModel() !== null
}

function probePort(): Promise<boolean> {
  return new Promise(resolve => {
    const s = new net.Socket()
    s.setTimeout(1000)
    s.connect(LOCAL_PORT, '127.0.0.1', () => { s.destroy(); resolve(true) })
    s.on('error', () => { s.destroy(); resolve(false) })
    s.on('timeout', () => { s.destroy(); resolve(false) })
  })
}

function setState(next: LocalState) {
  if (next === state) return
  state = next
  localEvents.emit('stateChange', next)
  console.log(`[whisper-local] ${next}`)
}

export async function startLocalWhisper(): Promise<void> {
  if (state === 'loading' || state === 'ready') return

  const binary = findBinary()
  const model  = findModel()

  if (!binary || !model) {
    console.warn('[whisper-local] binary or model not found')
    setState('error')
    return
  }

  setState('loading')

  proc = spawn(binary, [
    '-m', model,
    '--port', String(LOCAL_PORT),
    '--host', '127.0.0.1',
    '-t', '4',
  ], { stdio: 'ignore' })

  proc.on('exit', (code) => {
    proc = null
    if (state !== 'stopped') setState('stopped')
    console.log('[whisper-local] process exited, code:', code)
  })

  // Poll until server is accepting connections (model load can take 10–30s)
  const deadline = Date.now() + 90_000
  const poll = async () => {
    if (state !== 'loading') return
    if (Date.now() > deadline) {
      stopLocalWhisper()
      setState('error')
      return
    }
    if (await probePort()) {
      setState('ready')
    } else {
      setTimeout(poll, 1500)
    }
  }
  setTimeout(poll, 1500)
}

export function stopLocalWhisper(): void {
  proc?.kill()
  proc = null
  setState('stopped')
}
