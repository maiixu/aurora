import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(onDebugState?: (state: string) => void, onLogin?: () => void): Tray {
  // Use a simple template image; replace with proper icns in production
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('Aurora')

  const menu = Menu.buildFromTemplate([
    { label: 'Aurora', enabled: false },
    { type: 'separator' },
    { label: 'Open ChatGPT (Login)', click: () => onLogin?.() },
    { type: 'separator' },
    // Debug submenu for testing states
    {
      label: 'Debug: Trigger State',
      submenu: [
        { label: 'LISTENING',  click: () => onDebugState?.('LISTENING') },
        { label: 'PROCESSING', click: () => onDebugState?.('PROCESSING') },
        { label: 'READY',      click: () => onDebugState?.('READY') },
        { label: 'CANCELLED',  click: () => onDebugState?.('CANCELLED') },
        { label: 'IDLE',       click: () => onDebugState?.('IDLE') },
      ],
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  return tray
}
