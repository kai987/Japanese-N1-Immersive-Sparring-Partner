import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { atomicJson, cleanupPublishedCache, pendingDeploymentForMain, recoverableCheckpoint } from '../scripts/audio-worker.ts'
import type { Manifest } from '../scripts/validate-audio.ts'
test('checkpoints replace complete JSON, and an interrupted temporary write does not corrupt prior state', () => {
  const root = mkdtempSync(join(tmpdir(), 'n1-audio-checkpoint-'))
  try {
    const path = join(root, 'progress.json')
    atomicJson(path, { phase: 'uploading', verified: ['one'] })
    writeFileSync(`${path}.partial`, '{broken')
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { phase: 'uploading', verified: ['one'] })
    atomicJson(path, { phase: 'complete', verified: ['one', 'two'] })
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).phase, 'complete')
    writeFileSync(path, '{corrupt-checkpoint')
    assert.deepEqual(recoverableCheckpoint(path, { version: 1 }), { version: 1 })
  } finally { rmSync(root, { recursive: true, force: true }) }
})
test('a failed older deployment cannot pin recovery after main advances', () => {
  const old = 'a'.repeat(40), current = 'b'.repeat(40)
  assert.equal(pendingDeploymentForMain({ phase: 'retry_pending', releaseCommit: old }, old), old)
  assert.equal(pendingDeploymentForMain({ phase: 'retry_pending', releaseCommit: old }, current), null)
  assert.equal(pendingDeploymentForMain({ phase: 'complete', releaseCommit: old }, old), null)
  assert.equal(pendingDeploymentForMain({ phase: 'pushing', candidateCommit: old }, current), null)
})

test('cleanup removes only byte-verified published cache and retains unpublished candidates', () => {
  const root = mkdtempSync(join(tmpdir(), 'n1-audio-cleanup-'))
  try {
    const path = join(root, 'morioki-normal')
    mkdirSync(path)
    const published = 'a'.repeat(16), pending = 'b'.repeat(16), bytes = Buffer.from('verified recording')
    for (const id of [published, pending]) { writeFileSync(join(path, `${id}.mp3`), bytes); writeFileSync(join(path, `${id}.clip.json`), '{}') }
    cleanupPublishedCache(root, { clips: { [published]: { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') } } } as unknown as Manifest)
    assert.equal(existsSync(join(path, `${published}.mp3`)), false)
    assert.equal(existsSync(join(path, `${published}.clip.json`)), false)
    assert.equal(existsSync(join(path, `${pending}.mp3`)), true)
    assert.equal(existsSync(join(path, `${pending}.clip.json`)), true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
