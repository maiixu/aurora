import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'
import { TrayAnimator } from './tray-animator'

let tray: Tray | null = null
let trayAnimator: TrayAnimator | null = null

export function getTrayAnimator(): TrayAnimator | null { return trayAnimator }

export function createTray(_onDebugState?: (state: string) => void): Tray {
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  // Colored dot — do not use template (template forces black/white)
  tray = new Tray(icon)
  trayAnimator = new TrayAnimator(tray)
  tray.setToolTip('Aurora')

  const menu = Menu.buildFromTemplate([
    { label: 'Aurora', enabled: false },
    { type: 'separator' },
    { label: 'Quit Aurora', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  return tray
}
