import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

type Scenario = { branch?: string; ahead?: boolean; dirty?: boolean; changedAfterMerge?: boolean; detached?: boolean }
function bootstrapFixture(t: { after(callback: () => void): void }, scenario: Scenario) {
  const home = mkdtempSync(join(tmpdir(), 'n1-bootstrap-guard-'))
  t.after(() => rmSync(home, { recursive: true, force: true }))
  const root = join(home, 'Library/Application Support/N1 Audio'), calls = join(home, 'calls.json')
  mkdirSync(join(root, 'control/.git'), { recursive: true })
  const preserved = { 'progress.json': '{"phase":"retry_pending","jobPending":true}',
    'schedule.json': '{"version":1,"claimedDate":"2026-10-29"}', 'candidate.mp3': 'retain candidate bytes' }
  for (const [name, value] of Object.entries(preserved)) writeFileSync(join(root, name), value)
  const preload = join(home, 'fixture.mjs')
  writeFileSync(preload, `import os from 'node:os'; import child from 'node:child_process';
import { writeFileSync } from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
const scenario = ${JSON.stringify(scenario)}, calls = [], remote = 'a'.repeat(40); let merged = false;
os.homedir = () => ${JSON.stringify(home)};
const OriginalDate = Date; globalThis.Date = class extends OriginalDate {
  constructor(...args) { super(...(args.length ? args : ['2026-10-30T11:10:00+09:00'])); }
  static now() { return new OriginalDate('2026-10-30T11:10:00+09:00').getTime(); }
};
child.spawnSync = (command, args) => {
  calls.push({ command, args }); writeFileSync(${JSON.stringify(calls)}, JSON.stringify(calls));
  let stdout = '', status = 0;
  if (command === 'git') {
    if (args[0] === 'remote') stdout = 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git';
    else if (args[0] === 'status') stdout = scenario.dirty ? ' M worker.ts' : '';
    else if (args[0] === 'symbolic-ref') { stdout = scenario.branch ?? 'main'; if (scenario.detached) status = 1; }
    else if (args[0] === 'merge-base') status = scenario.ahead ? 1 : 0;
    else if (args[0] === 'merge') merged = true;
    else if (args[0] === 'rev-parse') stdout = args[1] === 'HEAD' && merged && scenario.changedAfterMerge ? 'b'.repeat(40) : remote;
  } else if (command !== process.execPath) throw new Error('Unexpected command: ' + command);
  return { status, stdout };
};
syncBuiltinESMExports();`)
  const result = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, 'scripts/audio-worker-bootstrap.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 10_000,
  })
  const recorded = JSON.parse(readFileSync(calls, 'utf8')) as { command: string; args: string[] }[]
  for (const [name, value] of Object.entries(preserved)) assert.equal(readFileSync(join(root, name), 'utf8'), value)
  return { result, calls: recorded, workerCalls: recorded.filter(call => call.command === process.execPath) }
}

test('bootstrap fast-forwards clean main to the fetched commit before executing its worker', t => {
  const { result, calls, workerCalls } = bootstrapFixture(t, {})
  assert.equal(result.status, 0, result.stderr)
  assert.equal(workerCalls.length, 1)
  assert.deepEqual(calls.find(call => call.args[0] === 'merge')?.args, ['merge', '--ff-only', 'a'.repeat(40)])
  assert.ok(calls.findIndex(call => call.args[0] === 'merge-base') < calls.findIndex(call => call.args[0] === 'merge'))
  assert.match(workerCalls[0].args[0], /control\/scripts\/audio-worker\.ts$/)
})

for (const [name, scenario] of Object.entries({
  'unpublished or divergent commits': { ahead: true },
  'a different clean branch': { branch: 'feature/local-worker' },
  'a detached checkout': { detached: true },
  'uncommitted changes': { dirty: true },
  'a checkout changed while updating': { changedAfterMerge: true },
})) test(`bootstrap preserves ${name} and never executes that worker`, t => {
  const { result, calls, workerCalls } = bootstrapFixture(t, scenario)
  assert.equal(result.status, 1)
  assert.equal(workerCalls.length, 0)
  assert.equal(JSON.parse(result.stderr).phase, 'bootstrap_retry_pending')
  assert.equal(calls.some(call => ['reset', 'stash', 'clean', 'checkout', 'switch'].includes(call.args[0])), false)
  if ('ahead' in scenario) assert.equal(calls.some(call => call.args[0] === 'merge'), false)
})
