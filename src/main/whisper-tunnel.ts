import { spawn, ChildProcess } from 'child_process'

export const EC2_WHISPER_PORT = 18080                                    // local tunnel port
const REMOTE_PORT = parseInt(process.env.AURORA_WHISPER_PORT ?? '8080') // whisper-server on EC2
const SSH_HOST    = process.env.AURORA_SSH_HOST ?? 'mac-ec2'

let tunnelProcess: ChildProcess | null = null

export function startWhisperTunnel(): void {
  if (tunnelProcess) return

  const { homedir } = require('os')
  const defaultKey = `${homedir()}/.ssh/aurora_ec2`

  tunnelProcess = spawn('ssh', [
    '-N',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-o', 'ExitOnForwardFailure=yes',
    '-o', 'StrictHostKeyChecking=no',
    '-i', defaultKey,
    '-L', `${EC2_WHISPER_PORT}:localhost:${REMOTE_PORT}`,
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

export function isTunnelConnected(): boolean {
  return tunnelProcess !== null
}
