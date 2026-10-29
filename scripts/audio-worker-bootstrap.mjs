// Installed as a local LaunchAgent entry point. It runs without a browser or LLM.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { audioSchedule, readAudioSchedule } from './audio-worker-schedule.ts'

const root = join(homedir(), 'Library/Application Support/N1 Audio')
const repository = 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git'
const control = join(root, 'control')
const schedule = audioSchedule(new Date(), readAudioSchedule(root))
if (!schedule.allowed) {
  console.log(JSON.stringify({ phase: 'scheduled_pause', reason: schedule.reason, nextOpening: schedule.nextOpening.toISOString() }))
  process.exit(0)
}
mkdirSync(root, { recursive: true, mode: 0o700 })
function run(command, args, cwd = root, capture = true) {
  const remaining = schedule.deadline.getTime() - Date.now()
  if (remaining <= 0) throw new Error('Audio window ended; resume next day')
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: capture ? Math.min(30 * 60_000, remaining) : remaining + 30_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GH_PROMPT_DISABLED: '1' }, stdio: capture ? 'pipe' : 'inherit' })
  if (result.error || result.status !== 0) throw new Error(`${command} failed (${result.status ?? 'unavailable'})`)
  return result.stdout?.trim() ?? ''
}
try {
  if (!existsSync(join(control, '.git'))) {
    const temporary = mkdtempSync(join(root, '.clone-'))
    try { run('git', ['clone', '--single-branch', '--branch', 'main', repository, temporary]); renameSync(temporary, control) }
    finally { rmSync(temporary, { recursive: true, force: true }) }
  }
  if (run('git', ['remote', 'get-url', 'origin'], control) !== repository || run('git', ['status', '--porcelain'], control)) throw new Error('Control checkout changed; preserving it for inspection')
  if (run('git', ['symbolic-ref', '--short', 'HEAD'], control) !== 'main') throw new Error('Control checkout must be on main; preserving it for inspection')
  run('git', ['fetch', '--no-tags', 'origin', 'main'], control)
  // --ff-only alone also accepts a local branch ahead of origin/main. Never
  // execute unpublished worker code, and preserve that checkout for inspection.
  try { run('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'], control) }
  catch { throw new Error('Control checkout is ahead of or diverged from origin/main; preserving it for inspection') }
  const main = run('git', ['rev-parse', 'origin/main'], control)
  run('git', ['merge', '--ff-only', main], control)
  if (run('git', ['rev-parse', 'HEAD'], control) !== main || run('git', ['symbolic-ref', '--short', 'HEAD'], control) !== 'main'
    || run('git', ['status', '--porcelain'], control)) throw new Error('Control checkout does not match fetched main; preserving it for inspection')
  run(process.execPath, [join(control, 'scripts/audio-worker.ts'), '--state-dir', root], control, false)
} catch (error) {
  console.error(JSON.stringify({ time: new Date().toISOString(), phase: 'bootstrap_retry_pending', error: error.message }))
  process.exitCode = 1
}
