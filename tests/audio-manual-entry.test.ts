import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'

for (const [outcome, exitCode] of [['success', 0], ['generator_failure', 7], ['busy', 75]] as const) {
  test(`manual npm recording entry forwards arguments through one session and preserves ${outcome}`, t => {
    const root = mkdtempSync(join(tmpdir(), 'n1-manual-audio-entry-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const bin = join(root, 'bin'), calls = join(root, 'calls.jsonl')
    mkdirSync(bin)
    // Exercise npm's actual argument/exit handling without Python, the engine,
    // user recordings, scheduling or production checkpoints being touched.
    writeFileSync(join(bin, 'python3'), `#!${process.execPath}
const { appendFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
appendFileSync(process.env.N1_ENTRY_CALLS, JSON.stringify(args) + '\\n');
if (args[0] === 'scripts/aivis-session.py' && args[1] === '--') {
  if (process.env.N1_ENTRY_OUTCOME === 'busy') process.exit(75);
  const child = spawnSync(args[2], args.slice(3), { env: process.env, stdio: 'inherit' });
  process.exit(child.status ?? 91);
}
if (args[0] === 'scripts/generate-audio.py') process.exit(process.env.N1_ENTRY_OUTCOME === 'generator_failure' ? 7 : 0);
process.exit(90);
`, { mode: 0o700 })
    const forwarded = ['--plan', join(root, 'frozen plan.json'), '--work-dir', join(root, 'recording cache'), '--workers', '4']
    const result = spawnSync('npm', ['--silent', 'run', 'audio:generate', '--', ...forwarded], {
      cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 15000,
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}`, N1_ENTRY_CALLS: calls, N1_ENTRY_OUTCOME: outcome },
    })
    assert.equal(result.error, undefined)
    assert.equal(result.status, exitCode, result.stderr)
    const observed = readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    assert.deepEqual(observed[0], ['scripts/aivis-session.py', '--', 'python3', 'scripts/generate-audio.py', ...forwarded])
    assert.deepEqual(observed.slice(1), outcome === 'busy' ? [] : [['scripts/generate-audio.py', ...forwarded]])
  })
}
