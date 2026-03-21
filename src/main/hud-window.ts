import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { HUD_WIDTH, HUD_HEIGHT, HUD_BOTTOM_OFFSET } from '../shared/constants'

let hudWin: BrowserWindow | null = null

export function createHudWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  hudWin = new BrowserWindow({
    width: HUD_WIDTH,
    height: HUD_HEIGHT,
    x: Math.round(sw / 2 - HUD_WIDTH / 2),
    y: sh - HUD_BOTTOM_OFFSET,
    frame: false,
    transparent: true,
    vibrancy: 'hud',
    visualEffectState: 'active',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    // 'panel' type appears above full-screen spaces on macOS
    type: 'panel',
    webPreferences: {
      preload: join(__dirname, '../preload/hud-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  // Ensure HUD floats above full-screen apps
  hudWin.setAlwaysOnTop(true, 'screen-saver')

  if (process.env.NODE_ENV === 'development') {
    hudWin.loadURL('http://localhost:5173/hud/index.html')
  } else {
    hudWin.loadFile(join(__dirname, '../renderer/hud/index.html'))
  }

  return hudWin
}

export function getHudWindow(): BrowserWindow | null {
  return hudWin
}

export function showHud(): void {
  hudWin?.show()
}

export function hideHud(): void {
  hudWin?.hide()
}
