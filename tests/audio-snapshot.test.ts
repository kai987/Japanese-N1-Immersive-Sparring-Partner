import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceNonLessonSnapshot, createNonLessonSnapshot, validateAudioCoverage, validateNonLessonSnapshot } from '../scripts/lib/audioSnapshot.ts'
import { mergeSharedAudio } from '../scripts/sync-audio.ts'
import { mergeUploadedRecordings, type VerifiedUpload } from '../scripts/lib/audioWorkerState.ts'
import type { Clip, Manifest } from '../scripts/validate-audio.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'
import { audioId, audioVoice } from '../src/lib/audioText.ts'

const before = '2026-10-29T00:00:00.000Z', now = '2026-10-30T00:00:00.000Z'
const sha = 'a'.repeat(64), commit = 'b'.repeat(40)
const speech = (text: string, reference: string) => ({ id: audioId(text), text, label: text, references: [reference] })
const oldLive = speech('前の配信の録音です。', 'live/2026-09-30/old/entry/前の配信の録音です。')
const oldCompound = speech('とりもどす', 'compound/toru/取り戻す/word')
const newLive = speech('新しい配信の録音です。', 'live/2026-10-29/new/example/0')
const newLesson = speech('新しい日次教材の録音です。', 'lesson/2026-10-30/title')
const clip = (entry: typeof oldLive): Clip => ({ ...structuredClone(entry), bytes: 1024, sha256: sha, duration: 1, rms: .1 })

function fixture() {
  const manifest: Manifest = { version: 1, voice: audioVoice, engineVersion: '1.1.0-dev', modelVersion: '1.0.0',
    generatedAt: before, complete: true, expectedClips: 2, lessonDates: ['2026-10-29'],
    clips: { [oldLive.id]: clip(oldLive), [oldCompound.id]: clip(oldCompound) } }
  manifest.nonLessonSnapshot = createNonLessonSnapshot(manifest)
  const index = { version: 1, voice: audioVoice, clips: { [oldLive.id]: 1, [oldCompound.id]: 1 } }
  const sources: AudioSources = { version: 1, voice: audioVoice, modelVersion: '1.0.0', complete: true, verifiedAt: before,
    sharedSource: { repository: 'https://github.com/kai987/japan-it-ai-daily', commit },
    providers: { daily: 'https://daily.example/', supabase: 'https://storage.example/' },
    summary: { total: 2, reused: 0, uploads: 2, savedBytes: 0, uploadBytes: 2048 },
    clips: Object.fromEntries([oldLive, oldCompound].map(entry => [entry.id, {
      provider: 'supabase' as const, path: `morioki-normal/${entry.id}--${sha}.mp3`, sha256: sha, bytes: 1024, duration: 1,
    }])) }
  const catalog = { version: 1, voice: audioVoice, lessonDates: ['2026-10-29'], entries: [oldLive, oldCompound, newLive] }
  const pending = { version: 1, voice: audioVoice, requiredClips: 3, pendingClips: 1, incompleteLessonDates: [], entries: [newLive] }
  return { manifest, index, sources, catalog, pending }
}

test('explicit published non-lesson snapshot allows a fully queued new note without claiming complete current coverage', () => {
  const { manifest, catalog, pending } = fixture()
  assert.deepEqual(validateAudioCoverage(manifest, catalog, pending), [newLive])
  assert.throws(() => validateAudioCoverage(manifest, catalog, pending, { requireCurrent: true }), /Current learning content is missing 1/)
  assert.deepEqual(manifest.nonLessonSnapshot, { [oldCompound.references[0]]: oldCompound.id, [oldLive.references[0]]: oldLive.id })
  assert.equal(Object.hasOwn(manifest.nonLessonSnapshot!, newLive.references[0]), false)
})

test('legacy manifests remain strict, and known published recordings cannot be removed or remapped', () => {
  const { manifest, catalog, pending } = fixture()
  const legacy = structuredClone(manifest)
  delete legacy.nonLessonSnapshot
  assert.throws(() => validateAudioCoverage(legacy, catalog, pending), /published audio snapshot is missing/)
  const removed = structuredClone(manifest)
  delete removed.clips[oldLive.id]
  assert.throws(() => validateAudioCoverage(removed, catalog, pending), /has no published recording/)
  const dropped = structuredClone(manifest)
  dropped.nonLessonSnapshot = {}
  assert.throws(() => validateNonLessonSnapshot(dropped), /not protected/)
  const remapped = structuredClone(manifest)
  remapped.nonLessonSnapshot![oldLive.references[0]] = oldCompound.id
  assert.throws(() => validateNonLessonSnapshot(remapped), /not protected/)
  const changedText = { ...oldLive, text: '同じ参照でも違う文章です。', id: audioId('同じ参照でも違う文章です。') }
  assert.throws(() => validateAudioCoverage(manifest, { ...catalog, entries: [changedText] }, pending), /changed identity/)
})

test('snapshot bindings reject invalid shapes, unrelated paths, absent recordings and identity collisions', () => {
  const { manifest } = fixture()
  for (const invalid of [null, [], { 'lesson/2026-10-29/title': oldLive.id }, { 'live/new/group/example/0': 'not-an-id' }, { 'live/new/group/example/0': 'f'.repeat(16) }]) {
    assert.throws(() => validateNonLessonSnapshot({ ...manifest, nonLessonSnapshot: invalid } as unknown as Manifest))
  }
  const duplicate = structuredClone(manifest)
  duplicate.clips[oldCompound.id].references.push(oldLive.references[0])
  assert.throws(() => createNonLessonSnapshot(duplicate), /changed identity/)
})

test('new notes need an accurate persisted pending entry, including every newly queued reference', () => {
  const { manifest, catalog, pending } = fixture()
  const invalid = [undefined, { ...pending, pendingClips: 0 }, { ...pending, voice: {} },
    { ...pending, entries: [], pendingClips: 0 },
    { ...pending, entries: [{ ...newLive, text: '違う音声です。' }] },
    { ...pending, entries: [{ ...newLive, references: ['live/other/group/example/0'] }] },
    { ...pending, entries: [newLive, newLive], pendingClips: 2 }]
  for (const queue of invalid) assert.throws(() => validateAudioCoverage(manifest, catalog, queue), /pending|Pending|queued/)
  const nextReference = 'live/2026-10-29/new/entry/別の参照'
  const multiple = { ...newLive, references: [...newLive.references, nextReference] }
  assert.throws(() => validateAudioCoverage(manifest, { ...catalog, entries: [oldLive, oldCompound, multiple] }, pending), /all current references/)
})

test('new lesson imports may await the ordinary follow-up without rewriting the separate note queue', () => {
  const { manifest, catalog, pending } = fixture()
  const extended = { ...catalog, lessonDates: ['2026-10-30', '2026-10-29'], entries: [...catalog.entries, newLesson] }
  assert.deepEqual(validateAudioCoverage(manifest, extended, pending), [newLive, newLesson])
  const reusedByNewLesson = { ...newLive, references: [...newLive.references, 'lesson/2026-10-30/immersion/0'] }
  assert.deepEqual(validateAudioCoverage(manifest, { ...extended, entries: [oldLive, oldCompound, reusedByNewLesson] }, pending), [reusedByNewLesson])
  const missingPublishedLesson = speech('公開済み日付の音声が消えました。', 'lesson/2026-10-29/title')
  assert.throws(() => validateAudioCoverage(manifest, { ...extended, entries: [...extended.entries, missingPublishedLesson] }, pending), /published audio snapshot is missing/)
})

test('a verified shared merge advances the note snapshot, preserves old history and remains idempotent', () => {
  const { manifest, index, sources, catalog } = fixture()
  const original = structuredClone({ manifest, index, sources })
  const candidate = { text: newLive.text, path: `japanese/2026-10-29/example-01--${sha}.mp3`, sha256: sha, manifest: 'manifest.json', date: '2026-10-29' }
  const result = mergeSharedAudio(catalog, manifest, index, sources, { [newLive.id]: { candidate, bytes: 2048, duration: 2, rms: .1 } }, commit, now)
  assert.equal(result.manifest.nonLessonSnapshot![newLive.references[0]], newLive.id)
  assert.equal(result.pending.pendingClips, 0)
  assert.deepEqual(validateAudioCoverage(result.manifest, catalog, result.pending, { requireCurrent: true }), [])
  for (const entry of [oldLive, oldCompound]) {
    assert.deepEqual(result.manifest.clips[entry.id], manifest.clips[entry.id])
    assert.deepEqual(result.sources.clips[entry.id], sources.clips[entry.id])
  }
  assert.deepEqual({ manifest, index, sources }, original)
  const repeated = mergeSharedAudio(catalog, result.manifest, result.index, result.sources, {}, commit, '2026-10-31T00:00:00Z')
  assert.deepEqual(repeated.manifest, result.manifest)
  assert.deepEqual(repeated.sources, result.sources)
})

test('a complete verified upload merge advances the note snapshot without rewriting prior clip metadata', () => {
  const { manifest, index, sources, catalog } = fixture()
  const candidate = { ...structuredClone(manifest), clips: { ...structuredClone(manifest.clips), [newLive.id]: clip(newLive) }, expectedClips: 3 }
  const verified: Record<string, VerifiedUpload> = { [newLive.id]: { verified: true, sha256: sha, bytes: 1024, path: `morioki-normal/${newLive.id}--${sha}.mp3` } }
  const result = mergeUploadedRecordings(catalog, manifest, index, sources, candidate, verified, now)
  assert.equal(result.manifest.nonLessonSnapshot![newLive.references[0]], newLive.id)
  assert.deepEqual(validateAudioCoverage(result.manifest, catalog, result.pending, { requireCurrent: true }), [])
  assert.deepEqual(result.manifest.clips[oldLive.id], manifest.clips[oldLive.id])
  const repeated = mergeUploadedRecordings(catalog, result.manifest, result.index, result.sources, candidate, {}, '2026-10-31T00:00:00Z')
  assert.deepEqual(repeated, result)
})

test('snapshot advancement records reused current references only for matching published speech and protects historical bindings', () => {
  const { manifest, catalog } = fixture()
  const extra = 'live/2026-10-29/reuse/entry/前の配信の録音です。'
  const reused = { ...oldLive, references: [extra] }
  const snapshot = advanceNonLessonSnapshot(manifest, { ...catalog, entries: [reused] }, manifest.clips)!
  assert.equal(snapshot[oldLive.references[0]], oldLive.id)
  assert.equal(snapshot[extra], oldLive.id)
  assert.equal(Object.hasOwn(snapshot, newLive.references[0]), false)
  assert.deepEqual(manifest.clips[oldLive.id].references, oldLive.references)
  const changed = { ...newLive, references: oldLive.references }
  assert.throws(() => advanceNonLessonSnapshot(manifest, { ...catalog, entries: [changed] }, { ...manifest.clips, [newLive.id]: clip(changed) }), /changed identity/)
})
