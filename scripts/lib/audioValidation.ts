import { spawn } from 'node:child_process'
import { closeSync, fstatSync, fsyncSync, mkdirSync, openSync, readFileSync, readSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

export interface AudioValidationOptions {
  cwd: string
  directory: string
  env?: NodeJS.ProcessEnv
  signal?: AbortSignal
  timeoutMs?: number
}

interface ValidationRun {
  version: number
  command: string
  args: string[]
  cwd: string
  startedAt: string
  timeoutMs: number
  pid: number | null
  endedAt?: string
  exitCode: number | null
  signal: NodeJS.Signals | null
  timedOut: boolean
  aborted: boolean
  stdoutBytes?: number
  stderrBytes?: number
  spawnError?: { code?: string; message: string }
}

const tailBytes = 8192

function tail(path: string) {
  const descriptor = openSync(path, 'r')
  try {
    const size = fstatSync(descriptor).size
    const buffer = Buffer.alloc(Math.min(size, tailBytes))
    const length = readSync(descriptor, buffer, 0, buffer.length, Math.max(0, size - buffer.length))
    return buffer.subarray(0, length).toString('utf8').trim() || '(empty)'
  } finally { closeSync(descriptor) }
}

/**
 * Opt-in diagnostics for validation commands only. Do not use this runner for
 * credential helpers: it deliberately preserves all child output, not its env.
 * The caller supplies a fresh directory outside the disposable attempt checkout.
 */
export async function runAudioValidation(command: string, args: string[], options: AudioValidationOptions): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 20 * 60_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647) {
    throw new Error('Audio validation timeout must be a positive integer')
  }
  const directory = resolve(options.directory)
  const stdoutPath = join(directory, 'stdout.log'), stderrPath = join(directory, 'stderr.log')
  const recordPath = join(directory, 'run.json')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const descriptors: number[] = []
  const record: ValidationRun = {
    version: 1, command, args: [...args], cwd: resolve(options.cwd),
    startedAt: new Date().toISOString(), timeoutMs, pid: null,
    exitCode: null, signal: null, timedOut: false, aborted: false,
  }
  let recordCreated = false
  const saveRecord = () => {
    if (!recordCreated) {
      const descriptor = openSync(recordPath, 'wx', 0o600)
      try { writeFileSync(descriptor, JSON.stringify(record, null, 2) + '\n'); fsyncSync(descriptor) }
      finally { closeSync(descriptor) }
      recordCreated = true
    } else {
      const temporary = `${recordPath}.partial`
      const descriptor = openSync(temporary, 'wx', 0o600)
      try { writeFileSync(descriptor, JSON.stringify(record, null, 2) + '\n'); fsyncSync(descriptor) }
      finally { closeSync(descriptor) }
      renameSync(temporary, recordPath)
    }
  }
  try {
    // Exclusive creation preserves a previous run instead of overwriting evidence.
    descriptors.push(openSync(stdoutPath, 'wx', 0o600))
    descriptors.push(openSync(stderrPath, 'wx', 0o600))
    saveRecord()
    if (options.signal?.aborted) record.aborted = true
    else await new Promise<void>(complete => {
      let timeout: ReturnType<typeof setTimeout> | undefined
      let forceStop: ReturnType<typeof setTimeout> | undefined
      let finished = false
      const child = spawn(command, args, {
        cwd: record.cwd, env: { ...process.env, ...options.env },
        // Files receive the complete byte streams without an in-memory output cap.
        stdio: ['ignore', descriptors[0], descriptors[1]],
        detached: process.platform !== 'win32',
      })
      record.pid = child.pid ?? null
      const terminate = (signal: NodeJS.Signals) => {
        // Only this newly created process group is signalled, including its server.
        if (process.platform !== 'win32' && child.pid) {
          try { process.kill(-child.pid, signal); return }
          catch (error) { if ((error as NodeJS.ErrnoException).code === 'ESRCH') return }
        }
        child.kill(signal)
      }
      const stop = (reason: 'abort' | 'timeout') => {
        if (finished) return
        if (reason === 'abort') record.aborted = true
        else record.timedOut = true
        terminate('SIGTERM')
        forceStop ??= setTimeout(() => terminate('SIGKILL'), 10_000)
      }
      const abort = () => stop('abort')
      options.signal?.addEventListener('abort', abort, { once: true })
      child.once('error', (error: NodeJS.ErrnoException) => {
        record.spawnError = { code: error.code, message: error.message }
      })
      child.once('close', (code, signal) => {
        finished = true
        clearTimeout(timeout)
        clearTimeout(forceStop)
        options.signal?.removeEventListener('abort', abort)
        record.exitCode = code
        record.signal = signal
        complete()
      })
      timeout = setTimeout(() => stop('timeout'), timeoutMs)
      // Recheck after subscribing so an abort concurrent with spawn is not lost.
      if (options.signal?.aborted) abort()
    })
    record.endedAt = new Date().toISOString()
    record.stdoutBytes = fstatSync(descriptors[0]).size
    record.stderrBytes = fstatSync(descriptors[1]).size
    for (const descriptor of descriptors) fsyncSync(descriptor)
    saveRecord()
  } catch (error) {
    if (recordCreated) {
      record.endedAt ??= new Date().toISOString()
      record.spawnError ??= { code: (error as NodeJS.ErrnoException).code, message: error instanceof Error ? error.message : String(error) }
      saveRecord()
    }
    throw error
  } finally {
    for (const descriptor of descriptors) closeSync(descriptor)
  }
  if (record.exitCode === 0 && !record.aborted && !record.timedOut && !record.spawnError) {
    return readFileSync(stdoutPath, 'utf8').trim()
  }
  const reason = record.aborted ? 'aborted' : record.timedOut ? 'timed out' : record.spawnError
    ? `could not start: ${record.spawnError.code ?? record.spawnError.message}`
    : record.signal ? `signal ${record.signal}` : `exit ${record.exitCode}`
  throw new Error(`${basename(command)} validation failed (${reason}). Diagnostics: ${directory}\n`
    + `stdout (last ${tailBytes} bytes):\n${tail(stdoutPath)}\n`
    + `stderr (last ${tailBytes} bytes):\n${tail(stderrPath)}`)
}
