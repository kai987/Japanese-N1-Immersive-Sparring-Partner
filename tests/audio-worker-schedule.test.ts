import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { AUDIO_CHECK_TIMES, audioSchedule, audioWorkReason, readAudioSchedule, unfinishedAudio } from '../scripts/audio-worker-schedule.ts'

test('nine Japan time checks include both endpoints, independently of the host time zone', () => {
  assert.deepEqual(AUDIO_CHECK_TIMES.map(({ hour, minute }) => `${hour}:${String(minute).padStart(2, '0')}`),
    ['11:10', '11:25', '11:40', '11:55', '12:10', '12:25', '12:40', '12:55', '13:10'])
  for (const { hour, minute } of AUDIO_CHECK_TIMES) {
    assert.equal(audioSchedule(new Date(`2026-10-20T${hour}:${String(minute).padStart(2, '0')}:00+09:00`)).allowed, true)
  }
  assert.equal(audioSchedule(new Date('2026-10-20T02:09:59Z')).allowed, false)
  assert.equal(audioSchedule(new Date('2026-10-20T02:10:00Z')).allowed, true)
  assert.equal(audioSchedule(new Date('2026-10-20T04:10:59Z')).allowed, true)
  const end = audioSchedule(new Date('2026-10-20T04:11:00Z'))
  assert.equal(end.allowed, false)
  assert.equal(end.nextOpening.toISOString(), '2026-10-21T02:10:00.000Z')
  assert.equal(audioSchedule(new Date('2026-10-20T01:00:00Z')).nextOpening.toISOString(), '2026-10-20T02:10:00.000Z')
})

test('detection suppresses all later checks that day, including failures; tomorrow automatically unlocks', () => {
  const state = { version: 1 as const, claimedDate: '2026-10-20', reason: 'resume_pending' }
  assert.equal(audioSchedule(new Date('2026-10-20T11:25:00+09:00'), state).reason, 'already_checked_today')
  assert.equal(audioSchedule(new Date('2026-10-20T13:10:00+09:00'), state).allowed, false)
  assert.equal(audioSchedule(new Date('2026-10-21T11:10:00+09:00'), state).allowed, true)
  assert.equal(audioSchedule(new Date('2026-10-21T00:00:00+09:00'), state).date, '2026-10-21')
})

test('empty checks do not claim the day; interrupted and failed jobs resume even with zero pending clips', () => {
  const date = '2026-10-20', commit = 'a'.repeat(40)
  assert.equal(audioWorkReason({ phase: 'complete', lastVerifiedCommit: commit }, date, [date], 0, commit), null)
  assert.equal(audioWorkReason({}, date, ['2026-10-19'], 0, commit), null)
  assert.equal(audioWorkReason({}, date, [date], 0, commit), 'today_lesson')
  assert.equal(audioWorkReason({}, date, [], 5, commit), 'missing_audio')
  for (const state of [{ phase: 'paused_window', jobPending: true }, { phase: 'retry_pending', failedPhase: 'validating', pendingClips: 0 }, { phase: 'waiting_daily_audio' }, { phase: 'awaiting_deploy' }]) {
    assert.equal(audioWorkReason(state, date, [], 0, commit), 'resume_pending')
  }
  assert.equal(unfinishedAudio({ phase: 'complete', jobPending: true }), false)
  assert.equal(unfinishedAudio({ phase: 'retry_pending', failedPhase: 'fetching' }), false)
})

test('a corrupt daily checkpoint fails closed instead of enabling a second job', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-schedule-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  assert.deepEqual(readAudioSchedule(root), {})
  for (const text of ['{broken', '{}', '{"version":1,"claimedDate":false}']) {
    writeFileSync(join(root, 'schedule.json'), text)
    assert.throws(() => readAudioSchedule(root))
    assert.equal(readFileSync(join(root, 'schedule.json'), 'utf8'), text)
  }
})

test('manual and installed entrypoints exit before Git/network and leave progress untouched outside the window or after detection', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-schedule-entrypoints-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const progress = '{"phase":"retry_pending","pendingClips":0,"failedPhase":"validating"}\n'
  writeFileSync(join(root, 'progress.json'), progress)
  const repository = fileURLToPath(new URL('../', import.meta.url))
  for (const scenario of [{ now: '2026-10-20T15:00:00+09:00', reason: 'outside_window' }, { now: '2026-10-20T11:25:00+09:00', reason: 'already_checked_today' }]) {
    const latch = { version: 1, claimedDate: '2026-10-20', reason: 'missing_audio' }
    writeFileSync(join(root, 'schedule.json'), JSON.stringify(latch))
    // Test-only preload controls the wall clock and the installed service's home.
    const preload = join(root, 'clock.mjs')
    writeFileSync(preload, `import os from 'node:os'; import {syncBuiltinESMExports} from 'node:module';
      const OriginalDate = Date; globalThis.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [${JSON.stringify(scenario.now)}])); } static now() { return new OriginalDate(${JSON.stringify(scenario.now)}).getTime(); } };
      os.homedir = () => ${JSON.stringify(root)}; syncBuiltinESMExports();`)
    const installedRoot = join(root, 'Library/Application Support/N1 Audio')
    mkdirSync(installedRoot, { recursive: true })
    copyFileSync(join(root, 'schedule.json'), join(installedRoot, 'schedule.json'))
    const worker = execFileSync(process.execPath, ['--import', pathToFileURL(preload).href, 'scripts/audio-worker.ts', '--state-dir', root], { cwd: repository, encoding: 'utf8' })
    const bootstrap = execFileSync(process.execPath, ['--import', pathToFileURL(preload).href, 'scripts/audio-worker-bootstrap.mjs'], { cwd: repository, encoding: 'utf8' })
    assert.equal(JSON.parse(worker).reason, scenario.reason)
    assert.equal(JSON.parse(bootstrap).reason, scenario.reason)
    assert.equal(readFileSync(join(root, 'progress.json'), 'utf8'), progress)
    assert.deepEqual(readAudioSchedule(root), latch)
  }
})

test('a detected failed job retains its latch and recordings, skips later checks, and resumes next day', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-schedule-recovery-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const bin = join(root, 'bin'), log = join(root, 'calls'), cache = join(root, 'candidate.mp3')
  mkdirSync(bin)
  writeFileSync(cache, 'keep generated bytes')
  writeFileSync(join(root, 'progress.json'), JSON.stringify({ phase: 'retry_pending', failedPhase: 'validating', pendingClips: 0 }))
  // Fail before any network access, after the job has been detected and claimed.
  for (const command of ['git', 'gh']) writeFileSync(join(bin, command), `#!/bin/sh\nprintf x >> '${log}'\nexit 3\n`, { mode: 0o700 })
  const repository = fileURLToPath(new URL('../', import.meta.url))
  const run = (now: string) => {
    const preload = join(root, 'clock.mjs')
    writeFileSync(preload, `const OriginalDate = Date; globalThis.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [${JSON.stringify(now)}])); } static now() { return new OriginalDate(${JSON.stringify(now)}).getTime(); } };`)
    // NODE_OPTIONS propagates this test-only clock through the Python OS-lock exec.
    return spawnSync(process.execPath, ['scripts/audio-worker.ts', '--state-dir', root], { cwd: repository, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, NODE_OPTIONS: `--import=${pathToFileURL(preload).href}` } })
  }
  assert.equal(run('2026-10-20T11:10:00+09:00').status, 1)
  assert.equal(readAudioSchedule(root).claimedDate, '2026-10-20')
  const calls = readFileSync(log, 'utf8')
  const progress = readFileSync(join(root, 'progress.json'), 'utf8')
  assert.equal(JSON.parse(progress).jobPending, true)
  assert.equal(run('2026-10-20T11:25:00+09:00').status, 0)
  assert.equal(readFileSync(log, 'utf8'), calls)
  assert.equal(readFileSync(join(root, 'progress.json'), 'utf8'), progress)
  assert.equal(run('2026-10-21T11:10:00+09:00').status, 1)
  assert.equal(readAudioSchedule(root).claimedDate, '2026-10-21')
  assert.equal(readFileSync(log, 'utf8').length, calls.length + 1)
  assert.equal(readFileSync(cache, 'utf8'), 'keep generated bytes')
})

test('an active job stops at the window deadline and checkpoints for tomorrow', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-schedule-deadline-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(root, 'progress.json'), JSON.stringify({ phase: 'uploading', pendingClips: 2 }))
  writeFileSync(join(root, 'uploads.json'), '{"verified":"keep proof"}')
  // A cancellable long-running subprocess represents synthesis or validation.
  writeFileSync(join(bin, 'git'), '#!/bin/sh\nexec sleep 30\n', { mode: 0o700 })
  const preload = join(root, 'clock.mjs')
  const offset = new Date('2026-10-20T13:10:58+09:00').getTime() - Date.now()
  writeFileSync(preload, `const OriginalDate = Date; globalThis.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [OriginalDate.now() + ${offset}])); } static now() { return OriginalDate.now() + ${offset}; } };`)
  const result = spawnSync(process.execPath, ['scripts/audio-worker.ts', '--state-dir', root], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 10_000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, NODE_OPTIONS: `--import=${pathToFileURL(preload).href}` },
  })
  assert.equal(result.status, 0, result.stderr)
  const progress = JSON.parse(readFileSync(join(root, 'progress.json'), 'utf8'))
  assert.equal(progress.phase, 'paused_window')
  assert.equal(progress.jobPending, true)
  assert.equal(progress.pendingClips, 2)
  assert.equal(progress.nextAttempt, '2026-10-21T02:10:00.000Z')
  assert.equal(readAudioSchedule(root).claimedDate, '2026-10-20')
  assert.equal(readFileSync(join(root, 'uploads.json'), 'utf8'), '{"verified":"keep proof"}')
})
