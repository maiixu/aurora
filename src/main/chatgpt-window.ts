import { BrowserWindow, session } from 'electron'
import { join } from 'path'

let chatgptWin: BrowserWindow | null = null

export function createChatGptWindow(): BrowserWindow {
  // Persistent partition so the user only logs in once
  const gptSession = session.fromPartition('persist:chatgpt')

  // Pre-approve mic permission for chatgpt.com so no browser prompt appears
  gptSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media')
  })

  chatgptWin = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      session: gptSession,
      preload: join(__dirname, '../preload/chatgpt-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  chatgptWin.loadURL('https://chatgpt.com')

  // Ensure audio is never muted and timers aren't throttled
  chatgptWin.webContents.setAudioMuted(false)
  chatgptWin.webContents.setBackgroundThrottling(false)

  return chatgptWin
}

export function getChatGptWindow(): BrowserWindow | null {
  return chatgptWin
}

/** Move the ChatGPT window on-screen so the user can log in. */
export function showChatGptForLogin() {
  if (!chatgptWin || chatgptWin.isDestroyed()) return
  chatgptWin.show()
  chatgptWin.setPosition(100, 100)
  chatgptWin.focus()
}

/**
 * Make the ChatGPT window "active" for audio capture without showing it to the user.
 * show() + minimize() keeps the window in the OS window list so Chromium routes
 * audio normally, but the user never sees it.
 */
export function showChatGptForRecording() {
  if (!chatgptWin || chatgptWin.isDestroyed()) return
  chatgptWin.showInactive()
  chatgptWin.minimize()
}

/** Hide the ChatGPT window completely. */
export function hideChatGptWindow() {
  if (!chatgptWin || chatgptWin.isDestroyed()) return
  chatgptWin.hide()
}
