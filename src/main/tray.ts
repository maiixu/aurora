import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(_onDebugState?: (state: string) => void): Tray {
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  // Colored dot — do not use template (template forces black/white)
  tray = new Tray(icon)
  tray.setToolTip('Aurora')

  const menu = Menu.buildFromTemplate([
    { label: 'Aurora', enabled: false },
    { type: 'separator' },
    { label: 'Quit Aurora', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  return tray
}
