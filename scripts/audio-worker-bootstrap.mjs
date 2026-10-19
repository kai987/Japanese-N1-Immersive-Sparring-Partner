// Installed as a local LaunchAgent entry point. It runs without a browser or LLM.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const root = join(homedir(), 'Library/Application Support/N1 Audio')
const repository = 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git'
const control = join(root, 'control')
mkdirSync(root, { recursive: true, mode: 0o700 })
function run(command, args, cwd = root, capture = true) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 30 * 60_000,
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
  run('git', ['fetch', '--no-tags', 'origin', 'main'], control)
  run('git', ['merge', '--ff-only', 'origin/main'], control)
  run(process.execPath, [join(control, 'scripts/audio-worker.ts'), '--state-dir', root], control, false)
} catch (error) {
  console.error(JSON.stringify({ time: new Date().toISOString(), phase: 'bootstrap_retry_pending', error: error.message }))
  process.exitCode = 1
}
