import { Tray, Menu, app, nativeImage, shell } from 'electron'
import { join } from 'path'
import { TrayAnimator } from './tray-animator'
import { AppState } from '../shared/types'
import { isTunnelConnected } from './whisper-tunnel'
import { getLocalState, activeModelName, isSetupComplete, startLocalWhisper, stopLocalWhisper } from './whisper-local'
import { readConfig, writeConfig, BackendMode } from './aurora-config'
import { startWhisperTunnel, stopWhisperTunnel } from './whisper-tunnel'

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
  if (isTunnelConnected()) return '🟢  EC2 Connected'
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
  } else {
    startWhisperTunnel()
  }
  updateTrayMenu()
}

function buildMenu(): Electron.Menu {
  return Menu.buildFromTemplate([
    { label: stateLabel(currentState), enabled: false },
    { type: 'separator' },
    { label: backendStatusLabel(), enabled: false },
    { label: 'Backend', submenu: buildBackendSubmenu() },
    { type: 'separator' },
    { label: `Aurora v${app.getVersion()}`, enabled: false },
    { type: 'separator' },
    { label: 'Open Dictionary', click: () => shell.openPath(join(process.env.HOME ?? '~', '.aurora', 'dictionary.txt')) },
    { type: 'separator' },
    { label: 'Quit Aurora', click: () => app.quit() },
  ])
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
