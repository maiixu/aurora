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
    show: false,  // always hidden; shown temporarily for login via tray
    webPreferences: {
      session: gptSession,
      preload: join(__dirname, '../preload/chatgpt-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  chatgptWin.loadURL('https://chatgpt.com')
  return chatgptWin
}

export function getChatGptWindow(): BrowserWindow | null {
  return chatgptWin
}

/** Show the ChatGPT window so the user can log in, then hide it again. */
export function showChatGptForLogin() {
  chatgptWin?.show()
}

export function hideChatGptWindow() {
  chatgptWin?.hide()
}
