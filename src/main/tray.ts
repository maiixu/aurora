import { Tray, Menu, app, nativeImage, shell } from 'electron'
import { join } from 'path'
import { TrayAnimator } from './tray-animator'
import { AppState } from '../shared/types'

let tray: Tray | null = null
let trayAnimator: TrayAnimator | null = null
let lastTranscript = ''
let currentState: AppState = AppState.IDLE

export function getTrayAnimator(): TrayAnimator | null { return trayAnimator }

function stateLabel(s: AppState): string {
  switch (s) {
    case AppState.IDLE:       return '⬤  Idle'
    case AppState.LISTENING:  return '⬤  Listening...'
    case AppState.PROCESSING: return '⬤  Processing...'
    case AppState.READY:      return '⬤  Done'
    case AppState.CANCELLED:  return '⬤  Cancelled'
  }
}

function buildMenu(): Electron.Menu {
  const transcript = lastTranscript
    ? lastTranscript.length > 48
      ? lastTranscript.slice(0, 48) + '…'
      : lastTranscript
    : '—'

  return Menu.buildFromTemplate([
    { label: stateLabel(currentState), enabled: false },
    { type: 'separator' },
    { label: transcript, enabled: false },
    { type: 'separator' },
    { label: 'Open Dictionary', click: () => shell.openPath(join(process.env.HOME ?? '~', '.aurora', 'dictionary.txt')) },
    { type: 'separator' },
    { label: 'Quit Aurora', click: () => app.quit() },
  ])
}

export function updateTrayMenu(state?: AppState, transcript?: string) {
  if (state !== undefined) currentState = state
  if (transcript !== undefined) lastTranscript = transcript
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
