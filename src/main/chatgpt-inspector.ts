// One-shot DOM inspector using Electron's webContents.debugger (CDP)
// Runs after page is ready, dumps all interactive elements to find voice button selector

import { getChatGptWindow } from './chatgpt-window'

export async function inspectChatGptDOM(): Promise<void> {
  const win = getChatGptWindow()
  if (!win) return

  try {
    win.webContents.debugger.attach('1.3')
  } catch {
    // already attached
  }

  const result = await win.webContents.debugger.sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const info = []

        // All buttons with any identifying attribute
        for (const btn of document.querySelectorAll('button')) {
          const label   = btn.getAttribute('aria-label')
          const testid  = btn.getAttribute('data-testid')
          const title   = btn.getAttribute('title')
          const hasSvg  = btn.querySelector('svg') !== null
          if (label || testid || title) {
            info.push({ tag: 'button', label, testid, title, hasSvg,
              text: btn.innerText?.trim().slice(0, 30) })
          }
        }

        // All SVG-containing buttons (mic often has no label)
        for (const btn of document.querySelectorAll('button')) {
          const svg = btn.querySelector('svg')
          if (!svg) continue
          const label  = btn.getAttribute('aria-label')
          const testid = btn.getAttribute('data-testid')
          if (!label && !testid) {
            // Include SVG viewBox + first path d= to identify mic icon
            const path = svg.querySelector('path')?.getAttribute('d')?.slice(0, 60)
            const vb   = svg.getAttribute('viewBox')
            info.push({ tag: 'btn+svg', label: null, testid: null,
              viewBox: vb, pathStart: path,
              cls: btn.className?.toString().slice(0, 60) })
          }
        }

        // Textarea / contenteditable
        const ta = document.querySelector('#prompt-textarea, textarea, [contenteditable="true"]')
        info.push({ tag: 'input', found: !!ta, id: ta?.id, nodeName: ta?.nodeName })

        return JSON.stringify(info, null, 2)
      })()
    `,
    returnByValue: true,
  })

  console.log('[inspector] DOM dump:\n', result.result.value)

  try { win.webContents.debugger.detach() } catch {}
}
