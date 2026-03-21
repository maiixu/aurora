import { systemPreferences, shell, Notification } from 'electron'

export async function ensureMicrophoneAccess(): Promise<boolean> {
  const status = systemPreferences.getMediaAccessStatus('microphone')
  console.log('[mic] status:', status)

  if (status === 'denied' || status === 'restricted') {
    console.warn('[mic] access denied/restricted — opening System Settings')
    notifyMicDenied()
    return false
  }

  // Call askForMediaAccess regardless of 'granted'/'not-determined' —
  // this forces the native TCC dialog if the system thinks it's needed,
  // and is a no-op (returns true immediately) if access is already valid.
  const granted = await systemPreferences.askForMediaAccess('microphone')
  console.log('[mic] askForMediaAccess result:', granted)
  if (!granted) notifyMicDenied()
  return granted
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
