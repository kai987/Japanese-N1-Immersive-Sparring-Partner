import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { repairOptions } from '../scripts/repair-audio.ts'
import { assertRepairScope } from '../scripts/audio-worker.ts'
import type { collectAudio } from '../scripts/collect-audio.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'

test('repair requires explicit dates and persistent evidence; automatic entrypoint has no implicit repair', () => {
  for (const args of [[], ['--force'], ['--dates', '2026-10-20'], ['--dates', '2026-10-20,2026-10-20', '--evidence-dir', '/tmp/e']]) assert.throws(() => repairOptions(args))
  const value = repairOptions(['--dates', '2026-10-20,2026-10-21', '--evidence-dir', '/tmp/e'])
  assert.deepEqual(value.dates, ['2026-10-20', '2026-10-21'])
  assert.equal(value.evidenceDirectory, '/tmp/e')
  const inherited = repairOptions(['--lock-fd', '3'], JSON.stringify(value))
  assert.equal(inherited.deadline, value.deadline)
  assert.throws(() => repairOptions(['--lock-fd', '3'], JSON.stringify({ ...value, deadline: Date.now() + 3 * 60 * 60_000 })))
})
test('repair refuses missing speech from another day or a non-lesson section before synthesis/upload', () => {
  const catalog = { lessonDates: ['2026-10-20', '2026-10-21'], entries: [
    { id: 'a', references: ['lesson/2026-10-20/vocab/a'] }, { id: 'b', references: ['lesson/2026-10-21/reading/a'] },
  ] } as unknown as ReturnType<typeof collectAudio>
  const sources = { clips: {} } as AudioSources
  assert.doesNotThrow(() => assertRepairScope(catalog, sources, ['2026-10-20', '2026-10-21']))
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-20']))
  assert.doesNotThrow(() => assertRepairScope(catalog, { clips: { b: {} } } as unknown as AudioSources, ['2026-10-20']))
  catalog.entries[0].references.push('compound-verbs/au/a')
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-20', '2026-10-21']))
  catalog.entries[0].references.pop()
  catalog.entries.push({ id: 'c', references: ['compound-verbs/au/a'] } as typeof catalog.entries[number])
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-20', '2026-10-21']))
})
test('foreground live units require explicit unique identities and survive inherited lock configuration', () => {
  const flags = ['--dates', '2026-10-30', '--evidence-dir', '/tmp/e']
  const value = repairOptions([...flags, '--live-units', '2026-10-29,2026-10-30'])
  assert.deepEqual(value.liveUnitIds, ['2026-10-29', '2026-10-30'])
  assert.deepEqual(repairOptions(['--lock-fd', '3'], JSON.stringify(value)).liveUnitIds, value.liveUnitIds)
  for (const units of ['', '2026-10-30,2026-10-30', '../outside']) {
    assert.throws(() => repairOptions([...flags, '--live-units', units]))
  }
  assert.throws(() => repairOptions([...flags, '--live-units', '2026-10-30', '--live-units', '2026-10-29']))
  assert.throws(() => repairOptions(['--lock-fd', '3'], JSON.stringify({ ...value, liveUnitIds: ['../outside'] })))
})
test('explicit live scope permits only those units and every reference of each missing recording', () => {
  const catalog = { lessonDates: ['2026-10-30'], entries: [
    { id: 'a', references: ['lesson/2026-10-30/reading/0'] },
    { id: 'b', references: ['live/2026-10-29/group/entry/old'] },
    { id: 'c', references: ['live/2026-10-30/group/entry/new'] },
  ] } as unknown as ReturnType<typeof collectAudio>
  const sources = { clips: {} } as AudioSources
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-30']))
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-30'], ['2026-10-30']))
  assert.doesNotThrow(() => assertRepairScope(catalog, sources, ['2026-10-30'], ['2026-10-29', '2026-10-30']))
  for (const units of [['missing'], ['all'], ['2026-10-30', '2026-10-30'], ['../outside']]) {
    assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-30'], units))
  }
  catalog.entries[2].references.push('live/2026-09-28/group/entry/other')
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-30'], ['2026-10-29', '2026-10-30']))
  catalog.entries[2].references.pop()
  catalog.entries[2].references.push('compound/au/example/0')
  assert.throws(() => assertRepairScope(catalog, sources, ['2026-10-30'], ['2026-10-29', '2026-10-30']))
})
test('one foreground repair obtains the real OS lock outside the window without changing the daily latch or cached bytes', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-explicit-repair-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const bin = join(root, 'bin');mkdirSync(bin)
  writeFileSync(join(root, 'schedule.json'), '{"version":1,"claimedDate":"2026-10-20","reason":"resume_pending"}\n')
  writeFileSync(join(root, 'progress.json'), '{"phase":"retry_pending","failedPhase":"validating"}\n')
  writeFileSync(join(root, 'candidate.mp3'), 'keep cache bytes')
  const latch = readFileSync(join(root, 'schedule.json'), 'utf8')
  const calls = join(root, 'calls')
  writeFileSync(join(bin, 'git'), `#!/bin/sh\nprintf x >> '${calls}'\nexit 3\n`, { mode: 0o700 })
  const preload = join(root, 'clock.mjs')
  writeFileSync(preload, `const OriginalDate=Date;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-10-20T15:00:00+09:00']))}static now(){return new OriginalDate('2026-10-20T15:00:00+09:00').getTime()}};`)
  const result = spawnSync(process.execPath, ['scripts/repair-audio.ts', '--dates', '2026-10-20,2026-10-21', '--evidence-dir', join(root, 'evidence'), '--state-dir', root], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 10000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, NODE_OPTIONS: `--import=${pathToFileURL(preload).href}` },
  })
  assert.equal(result.status, 1, result.stderr)
  assert.equal(readFileSync(calls, 'utf8'), 'x')
  assert.equal(readFileSync(join(root, 'schedule.json'), 'utf8'), latch)
  assert.equal(readFileSync(join(root, 'candidate.mp3'), 'utf8'), 'keep cache bytes')
  assert.equal(JSON.parse(readFileSync(join(root, 'progress.json'), 'utf8')).phase, 'retry_pending')
})
