import { defineCommand } from 'citty'
import { output, isJsonOutput } from '../utils/output'
import { readPid, isProcessRunning, getPort } from '../utils/process'
import { discoverServerUrl } from '../utils/server'
import { globalArgs, toFlags, setupJsonOutput } from './shared'

async function handleStatusCommand(flags: Record<string, string>) {
  const pid = readPid()
  const port = getPort(flags.port)
  const serverUrl = discoverServerUrl(flags.url, flags.port)

  // Check if PID file exists and process is running
  const pidRunning = pid !== null && isProcessRunning(pid)

  // Always try health endpoint, regardless of PID status
  let healthOk = false
  let version: string | null = null
  let uptime: number | null = null
  try {
    const res = await fetch(`${serverUrl}/health`, { signal: AbortSignal.timeout(2000) })
    healthOk = res.ok
    if (res.ok) {
      const health = await res.json()
      version = health.version || null
      uptime = health.uptime || null
    }
  } catch {
    // Server not responding
  }

  // Server is running if either PID is alive or health endpoint responds
  const running = pidRunning || healthOk

  const data = {
    running,
    healthy: healthOk,
    pid: pid || null,
    port,
    url: serverUrl,
    version,
    uptime,
  }

  if (isJsonOutput()) {
    output(data)
  } else {
    if (running) {
      const healthStatus = healthOk ? 'healthy' : 'not responding'
      console.log(`Fulcrum is running (${healthStatus})`)
      if (pidRunning) console.log(`  PID:  ${pid}`)
      console.log(`  URL:  ${serverUrl}`)
      if (version) console.log(`  Version: ${version}`)
      if (uptime) console.log(`  Uptime:  ${Math.floor(uptime / 1000)}s`)
    } else {
      console.log('Fulcrum is not running')
      console.log(`\nStart with: fulcrum up`)
    }
  }
}

// ============================================================================
// Command Definition
// ============================================================================

export const statusCommand = defineCommand({
  meta: { name: 'status', description: 'Show server status' },
  args: globalArgs,
  async run({ args }) {
    setupJsonOutput(args)
    await handleStatusCommand(toFlags(args))
  },
})
