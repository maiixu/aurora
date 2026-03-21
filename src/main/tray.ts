import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(_onDebugState?: (state: string) => void): Tray {
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z8BAAoxqoJMGRkdH/6MuAAAvBgABFqNAsgAAAABJRU5ErkJggg=='
    )
  }
  icon.setTemplateImage(true)
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
