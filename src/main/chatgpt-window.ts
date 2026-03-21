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
  chatgptWin?.setPosition(100, 100)
  chatgptWin?.focus()
}

/** Return the ChatGPT window to off-screen position. */
export function hideChatGptWindow() {
  chatgptWin?.setPosition(-10000, 0)
}
