import { systemPreferences, shell, Notification } from 'electron'

export async function ensureMicrophoneAccess(): Promise<boolean> {
  const status = systemPreferences.getMediaAccessStatus('microphone')

  if (status === 'granted') return true

  if (status === 'not-determined') {
    const granted = await systemPreferences.askForMediaAccess('microphone')
    if (!granted) {
      notifyMicDenied()
    }
    return granted
  }

  // 'denied' or 'restricted'
  notifyMicDenied()
  return false
}

function notifyMicDenied() {
  new Notification({
    title: 'Aurora needs microphone access',
    body: 'Open System Settings → Privacy & Security → Microphone to enable it.',
  }).show()

  // Deep-link to the Privacy pane
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
  )
}
