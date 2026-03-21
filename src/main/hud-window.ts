import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { HUD_CORNER_MARGIN } from '../shared/constants'

let hudWin: BrowserWindow | null = null

/** Dot size scales with screen height: ~1/50 of screen height, clamped 18–40px */
function dotSize(sh: number): number {
  return Math.round(Math.min(Math.max(sh / 50, 18), 40))
}

export function createHudWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const sz = dotSize(sh)

  hudWin = new BrowserWindow({
    width: sz,
    height: sz,
    x: Math.round(sw / 2 - sz / 2),
    y: sh - sz - HUD_CORNER_MARGIN,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
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
