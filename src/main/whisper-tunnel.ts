import { spawn, ChildProcess } from 'child_process'
import * as net from 'net'

export const EC2_WHISPER_PORT = 18080                                    // local tunnel port
const REMOTE_PORT = parseInt(process.env.AURORA_WHISPER_PORT ?? '8080') // whisper-server on EC2
const SSH_HOST    = process.env.AURORA_SSH_HOST ?? 'mac-ec2'

let tunnelProcess: ChildProcess | null = null
let portReachable = false   // true when port is bound by an external tunnel

function probePort(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const s = new net.Socket()
    s.setTimeout(1500)
    s.connect(port, '127.0.0.1', () => { s.destroy(); resolve(true) })
    s.on('error', () => { s.destroy(); resolve(false) })
    s.on('timeout', () => { s.destroy(); resolve(false) })
  })
}

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

  tunnelProcess.on('exit', async (code) => {
    console.log('[whisper-tunnel] exited, code:', code)
    tunnelProcess = null
    // Port already bound by another process (e.g. previous Aurora session) → probe
    if (code !== 0) {
      portReachable = await probePort(EC2_WHISPER_PORT)
      if (portReachable) {
        console.log('[whisper-tunnel] port already bound by existing tunnel — reusing')
      }
    } else {
      portReachable = false
    }
  })

  console.log(`[whisper-tunnel] SSH tunnel started → localhost:${EC2_WHISPER_PORT}`)
}

export function stopWhisperTunnel(): void {
  tunnelProcess?.kill()
  tunnelProcess = null
  portReachable = false
}

export function isTunnelConnected(): boolean {
  return tunnelProcess !== null || portReachable
}
