import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(onDebugState?: (state: string) => void, onLogin?: () => void, onInspect?: () => void): Tray {
  // Use a simple template image; replace with proper icns in production
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    // Fallback: 16x16 white circle so menu bar item is always clickable
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z8BAAoxqoJMGRkdH/6MuAAAvBgABFqNAsgAAAABJRU5ErkJggg=='
    )
  }
  icon.setTemplateImage(true)  // macOS: adapts to light/dark menu bar
  tray = new Tray(icon)
  tray.setToolTip('Aurora')

  const menu = Menu.buildFromTemplate([
    { label: 'Aurora', enabled: false },
    { type: 'separator' },
    { label: 'Open ChatGPT (Login)', click: () => onLogin?.() },
    { label: 'Inspect ChatGPT Window (DevTools)', click: () => onInspect?.() },
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
