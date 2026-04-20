import { Tray, Menu, app, nativeImage, shell } from 'electron'
import { join } from 'path'
import { TrayAnimator } from './tray-animator'
import { AppState } from '../shared/types'
import { isTunnelConnected } from './whisper-tunnel'
import { getLocalState, activeModelName, listModels, setLocalModel, isSetupComplete, startLocalWhisper, stopLocalWhisper } from './whisper-local'
import { readConfig, writeConfig, BackendMode } from './aurora-config'
import { startWhisperTunnel, stopWhisperTunnel } from './whisper-tunnel'
import { execSync } from 'child_process'

// Cache EC2 model name (detected once via SSH)
let ec2ModelCache: string | null = null
function getEc2ModelName(): string {
  if (ec2ModelCache) return ec2ModelCache
  try {
    const ps = execSync('ssh mac-ec2 "ps aux | grep whisper-server | grep -v grep"', { timeout: 3000 }).toString()
    const m = ps.match(/ggml-([\w-]+)\.bin/)
    ec2ModelCache = m ? m[1] : 'whisper'
  } catch { ec2ModelCache = 'whisper' }
  return ec2ModelCache
}

let tray: Tray | null = null
let trayAnimator: TrayAnimator | null = null
let currentState: AppState = AppState.IDLE

export function getTrayAnimator(): TrayAnimator | null { return trayAnimator }

function stateLabel(s: AppState): string {
  switch (s) {
    case AppState.IDLE:         return '⚪  Idle'
    case AppState.LISTENING:    return '🟢  Listening...'
    case AppState.PROCESSING:   return '🟡  Processing...'
    case AppState.TRANSCRIBING: return '🟡  Transcribing...'
    case AppState.READY:        return '✅  Done'
    case AppState.CANCELLED:    return '🔴  Cancelled'
  }
}

function backendStatusLabel(): string {
  const cfg = readConfig()
  if (cfg.backend === 'openai') return `🟢  OpenAI Whisper`
  if (isTunnelConnected()) return `🟢  EC2 (${getEc2ModelName()})`
  const ls = getLocalState()
  if (ls === 'ready')   return `🟢  Local (${activeModelName() ?? 'whisper'})`
  if (ls === 'loading') return '🔄  Loading local model...'
  if (ls === 'error')   return '🔴  Local Error'
  return '🔴  No Backend'
}

function buildBackendSubmenu(): Electron.MenuItemConstructorOptions[] {
  const cfg = readConfig()
  const modes: { label: string; mode: BackendMode }[] = [
    { label: 'Auto (EC2 → Local)', mode: 'auto' },
    { label: 'EC2 only',           mode: 'ec2'  },
    { label: 'Local only',         mode: 'local' },
    { label: 'OpenAI Whisper API', mode: 'openai' },
  ]
  return modes.map(({ label, mode }) => ({
    label,
    type: 'radio' as const,
    checked: cfg.backend === mode,
    enabled: mode !== 'local' || isSetupComplete(),
    click: () => setBackend(mode),
  }))
}

function setBackend(mode: BackendMode) {
  writeConfig({ backend: mode })
  stopWhisperTunnel()
  stopLocalWhisper()
  if (mode === 'local') {
    startLocalWhisper()
  } else if (mode !== 'openai') {
    startWhisperTunnel()
  }
  updateTrayMenu()
}

function buildModelSubmenu(): Electron.MenuItemConstructorOptions[] {
  const cfg = readConfig()
  const models = listModels()
  if (models.length === 0) return [{ label: 'No models found', enabled: false }]
  return models.map(stem => ({
    label: stem,
    type: 'radio' as const,
    checked: cfg.localModel === stem,
    click: () => {
      setLocalModel(stem)
      // Restart local whisper with new model if currently running
      const ls = getLocalState()
      if (ls === 'ready' || ls === 'loading') {
        stopLocalWhisper()
        startLocalWhisper()
      }
      updateTrayMenu()
    },
  }))
}

function buildMenu(): Electron.Menu {
  const cfg = readConfig()
  const showModelMenu = cfg.backend === 'local' || cfg.backend === 'auto'
  const items: Electron.MenuItemConstructorOptions[] = [
    { label: stateLabel(currentState), enabled: false },
    { type: 'separator' },
    { label: backendStatusLabel(), enabled: false },
    { label: 'Backend', submenu: buildBackendSubmenu() },
  ]
  if (showModelMenu) {
    items.push({ label: 'Local Model', submenu: buildModelSubmenu() })
  }
  if (cfg.backend === 'openai') {
    const hasKey = !!cfg.openaiApiKey
    items.push({
      label: hasKey ? 'OpenAI API Key: set ✓' : 'Set OpenAI API Key…',
      click: () => {
        const { execSync } = require('child_process') as typeof import('child_process')
        try {
          const result = execSync(
            `osascript -e 'text returned of (display dialog "Enter OpenAI API Key:" default answer "" with hidden answer)'`,
            { encoding: 'utf-8' }
          ).trim()
          if (result) {
            writeConfig({ openaiApiKey: result })
            updateTrayMenu()
          }
        } catch { /* user cancelled */ }
      },
    })
  }
  items.push(
    { label: `Aurora v${app.getVersion()}`, enabled: false },
    { type: 'separator' },
    { label: 'Open Dictionary', click: () => shell.openPath(join(process.env.HOME ?? '~', '.aurora', 'dictionary.txt')) },
    { type: 'separator' },
    { label: 'Quit Aurora', click: () => app.quit() },
  )
  return Menu.buildFromTemplate(items)
}

export function updateTrayMenu(state?: AppState) {
  if (state !== undefined) currentState = state
  tray?.setContextMenu(buildMenu())
}

export function createTray(): Tray {
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  trayAnimator = new TrayAnimator(tray)
  tray.setToolTip('Aurora')
  tray.setContextMenu(buildMenu())
  return tray
}
