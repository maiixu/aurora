import { spawn, ChildProcess } from 'child_process'

export const EC2_WHISPER_PORT = 18080  // local tunnel port
const SSH_HOST = 'mac-ec2'

let tunnelProcess: ChildProcess | null = null

export function startWhisperTunnel(): void {
  if (tunnelProcess) return

  tunnelProcess = spawn('ssh', [
    '-N',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-o', 'ExitOnForwardFailure=yes',
    '-L', `${EC2_WHISPER_PORT}:localhost:8080`,
    SSH_HOST,
  ], {
    stdio: 'ignore',
    env: { ...process.env, SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK ?? '' },
  })

  tunnelProcess.on('exit', (code) => {
    console.log('[whisper-tunnel] exited, code:', code)
    tunnelProcess = null
  })

  console.log(`[whisper-tunnel] SSH tunnel started → localhost:${EC2_WHISPER_PORT}`)
}

export function stopWhisperTunnel(): void {
  tunnelProcess?.kill()
  tunnelProcess = null
}
