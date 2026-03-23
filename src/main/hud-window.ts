import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { HUD_CORNER_MARGIN, TRANSCRIBING_LINE_HEIGHT, TRANSCRIBING_PADDING_V, TRANSCRIBING_MIN_DOT } from '../shared/constants'

let hudWin: BrowserWindow | null = null

/** Dot size scales with screen height: ~1/40 of screen height, clamped 22–48px */
function dotSize(sh: number): number {
  return Math.round(Math.min(Math.max(sh / 40, 22), 48))
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

function repositionHud(): void {
  if (!hudWin || hudWin.isDestroyed()) return
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const sz = dotSize(sh)
  hudWin.setBounds({
    x: Math.round(sw / 2 - sz / 2),
    y: sh - sz - HUD_CORNER_MARGIN,
    width: sz,
    height: sz,
  })
}

export function watchScreenChanges(): void {
  screen.on('display-added', repositionHud)
  screen.on('display-removed', repositionHud)
  screen.on('display-metrics-changed', repositionHud)
}

export function showHud(): void {
  hudWin?.show()
}

export function hideHud(): void {
  hudWin?.hide()
}

/** Snap HUD to TRANSCRIBING panel. lines=1 is the minimum; grows dynamically as text arrives. */
export function resizeForTranscribing(lines = 1): void {
  if (!hudWin || hudWin.isDestroyed()) return
  const { bounds, workAreaSize } = screen.getPrimaryDisplay()
  const sw = workAreaSize.width
  const sh = workAreaSize.height
  const menuBarH = bounds.height - sh

  const panelW = Math.min(Math.round(sh / 40 * 24), 700)
  const maxH = Math.floor(sh * 0.35)
  const panelH = Math.min(
    2 * TRANSCRIBING_PADDING_V + Math.max(1, lines) * TRANSCRIBING_LINE_HEIGHT,
    maxH
  )
  const x = Math.round(sw / 2 - panelW / 2)
  const y = Math.max(sh - panelH - HUD_CORNER_MARGIN, menuBarH + 4)

  hudWin.setBounds({ x, y, width: panelW, height: panelH })
}

/** Restore HUD to its original dot-only size. */
export function resizeForDot(): void {
  if (!hudWin || hudWin.isDestroyed()) return
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const sz = dotSize(sh)
  hudWin.setBounds({
    x: Math.round(sw / 2 - sz / 2),
    y: sh - sz - HUD_CORNER_MARGIN,
    width: sz,
    height: sz,
  })
}
