import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeUploadedRecordings, type AudioIndex, type VerifiedUpload } from '../scripts/lib/audioWorkerState.ts'
import type { Manifest } from '../scripts/validate-audio.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'
import { audioId, audioVoice } from '../src/lib/audioText.ts'

const oldTime = '2026-10-18T00:00:00.000Z', now = '2026-10-19T00:00:00.000Z'
const entry = (text: string, date: string) => ({ id: audioId(text), text, label: text, references: [`lesson/${date}/title`] })
const previous = entry('公開済みです。', '2026-10-18'), shared = entry('共有音声です。', '2026-10-18')
const historical = entry('過去の教材です。', '2026-10-17'), added = entry('新しい教材です。', '2026-10-19')
const sha = 'a'.repeat(64), nextSha = 'b'.repeat(64), upstreamCommit = 'c'.repeat(40)
const clip = (item: ReturnType<typeof entry>, hash = sha) => ({ ...item, bytes: 1024, sha256: hash, duration: 1.25, rms: .08 })

function fixture() {
  const oldClips = [previous, shared, historical].map(item => clip(item))
  const manifest: Manifest = { version: 1, voice: { ...audioVoice }, engineVersion: '1.1.0-dev', modelVersion: '1.0.0',
    generatedAt: oldTime, complete: true, expectedClips: 3, lessonDates: ['2026-10-18', '2026-10-17'],
    clips: Object.fromEntries(oldClips.map(item => [item.id, item])) }
  const index: AudioIndex = { version: 1, voice: { ...audioVoice }, clips: Object.fromEntries(oldClips.map(item => [item.id, item.duration])) }
  const sources: AudioSources = { version: 1, voice: { ...audioVoice }, modelVersion: '1.0.0', complete: true, verifiedAt: oldTime,
    sharedSource: { repository: 'https://github.com/kai987/japan-it-ai-daily', commit: upstreamCommit },
    providers: { daily: 'https://daily.example/', supabase: 'https://storage.example/storage/v1/object/public/n1-audio/' },
    summary: { total: 3, reused: 1, uploads: 2, savedBytes: 1024, uploadBytes: 2048 },
    clips: Object.fromEntries(oldClips.map(item => [item.id, {
      provider: item.id === shared.id ? 'daily' as const : 'supabase' as const,
      path: item.id === shared.id ? `japanese/2026-10-18/example-01--${sha}.mp3` : `morioki-normal/${item.id}--${sha}.mp3`,
      bytes: item.id === shared.id ? 1536 : item.bytes, duration: item.duration, sha256: item.sha256,
    }])) }
  const catalog = { version: 1, voice: { ...audioVoice }, lessonDates: ['2026-10-19', '2026-10-18'], entries: [previous, shared, added] }
  const candidate: Manifest = { ...structuredClone(manifest), clips: { ...structuredClone(manifest.clips), [added.id]: clip(added, nextSha) }, expectedClips: 4 }
  const verified: Record<string, VerifiedUpload> = { [added.id]: { path: `morioki-normal/${added.id}--${nextSha}.mp3`, sha256: nextSha, bytes: 1024, verified: true } }
  return { catalog, manifest, index, sources, candidate, verified }
}

test('audio worker merges a complete verified upload batch and recomputes counts and covered dates', () => {
  const { catalog, manifest, index, sources, candidate, verified } = fixture()
  const before = structuredClone({ catalog, manifest, index, sources, candidate, verified })
  const result = mergeUploadedRecordings(catalog, manifest, index, sources, candidate, verified, now)
  assert.deepEqual(result.sources.clips[added.id], { provider: 'supabase', path: verified[added.id].path,
    sha256: nextSha, bytes: 1024, duration: 1.25 })
  assert.deepEqual(result.manifest.clips[added.id], clip(added, nextSha))
  assert.equal(result.index.clips[added.id], 1.25)
  assert.deepEqual(result.sources.summary, { total: 4, reused: 1, uploads: 3, savedBytes: 1024, uploadBytes: 3072 })
  assert.equal(result.manifest.expectedClips, 4)
  assert.equal(result.manifest.complete, true)
  assert.deepEqual(result.manifest.lessonDates, ['2026-10-19', '2026-10-18', '2026-10-17'])
  assert.equal(result.manifest.generatedAt, now)
  assert.equal(result.sources.verifiedAt, now)
  assert.deepEqual(result.pending, { version: 1, voice: audioVoice, requiredClips: 3, pendingClips: 0, incompleteLessonDates: [], entries: [] })
  assert.deepEqual({ catalog, manifest, index, sources, candidate, verified }, before, 'input state is immutable')
})

test('audio worker retries do not create timestamp-only metadata changes', () => {
  const { catalog, manifest, index, sources, candidate, verified } = fixture()
  const first = mergeUploadedRecordings(catalog, manifest, index, sources, candidate, verified, now)
  const repeated = mergeUploadedRecordings(catalog, first.manifest, first.index, first.sources, candidate, {}, '2026-10-20T00:00:00.000Z')
  assert.deepEqual(repeated, first)
})

test('audio worker preserves historical clips, R2 providers and all existing recording metadata', () => {
  const { catalog, manifest, index, sources, candidate, verified } = fixture()
  candidate.clips[shared.id] = { ...candidate.clips[shared.id], sha256: nextSha, bytes: 9999, references: ['candidate/must-not-rewrite-r2'] }
  catalog.entries[0] = { ...previous, references: ['lesson/2026-10-19/vocabulary/reused'] }
  const result = mergeUploadedRecordings(catalog, manifest, index, sources, candidate, verified, now)
  for (const item of [previous, shared, historical]) {
    assert.deepEqual(result.manifest.clips[item.id], manifest.clips[item.id])
    assert.equal(result.index.clips[item.id], index.clips[item.id])
    assert.deepEqual(result.sources.clips[item.id], sources.clips[item.id])
  }
  assert.deepEqual(result.sources.sharedSource, sources.sharedSource)
  assert.deepEqual(result.sources.providers, sources.providers)
})

test('audio worker rejects incomplete or unverified upload batches without publishing partial state', () => {
  const { catalog, manifest, index, sources, candidate, verified } = fixture()
  assert.throws(() => mergeUploadedRecordings(catalog, manifest, index, sources, candidate, {}, now), /verified/)
  const absent = structuredClone(candidate)
  delete absent.clips[added.id]
  assert.throws(() => mergeUploadedRecordings(catalog, manifest, index, sources, absent, verified, now), /Missing or invalid/)
  const another = entry('未完了の録音です。', '2026-10-19')
  const partialCatalog = { ...catalog, entries: [...catalog.entries, another] }
  assert.throws(() => mergeUploadedRecordings(partialCatalog, manifest, index, sources, candidate, verified, now), /Missing or invalid/)
  assert.equal(Object.hasOwn(manifest.clips, added.id), false)
  assert.equal(Object.hasOwn(index.clips, added.id), false)
  assert.equal(Object.hasOwn(sources.clips, added.id), false)
  for (const changed of [
    { verified: false }, { path: `interview-audio/${added.id}.mp3` },
    { sha256: sha }, { bytes: 2048 },
  ]) {
    const unverified = { [added.id]: { ...verified[added.id], ...changed } } as Record<string, VerifiedUpload>
    assert.throws(() => mergeUploadedRecordings(catalog, manifest, index, sources, candidate, unverified, now), /verified/)
  }
})

test('audio worker rejects different voices, models, identities and invalid synthesis measurements', () => {
  const { catalog, manifest, index, sources, candidate, verified } = fixture()
  for (const changed of [
    { voice: { ...audioVoice, styleId: 1 } }, { modelVersion: '2.0.0' },
  ]) assert.throws(() => mergeUploadedRecordings(catalog, manifest, index, sources, { ...candidate, ...changed } as Manifest, verified, now), /voice\/model/)
  for (const changed of [
    { text: '違う文です。' }, { id: previous.id }, { duration: NaN }, { duration: .01 },
    { rms: 0 }, { rms: 1.1 }, { bytes: 511 }, { bytes: 1_048_577 }, { sha256: 'not-a-hash' },
  ]) {
    const invalid = structuredClone(candidate)
    Object.assign(invalid.clips[added.id], changed)
    assert.throws(() => mergeUploadedRecordings(catalog, manifest, index, sources, invalid, verified, now), /Missing or invalid/)
  }
  assert.throws(() => mergeUploadedRecordings(catalog, manifest, index, sources, candidate, verified, 'not-a-date'), /verification time/)
})
