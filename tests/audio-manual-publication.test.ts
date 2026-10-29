import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { audioId, audioVoice } from '../src/lib/audioText.ts'
import { prepareManualAudioSnapshot } from '../scripts/lib/audioSnapshot.ts'
import { saveManualAudioPublication, verifyManualAudioPublication } from '../scripts/lib/manualAudioPublication.ts'
import type { Manifest } from '../scripts/validate-audio.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'

function fixture() {
  const data = Buffer.alloc(1024, 42), sha256 = createHash('sha256').update(data).digest('hex')
  const clip = (text: string, reference: string) => ({ id: audioId(text), text, label: text, references: [reference], bytes: data.length, duration: 1.5, rms: .1, sha256 })
  const old = clip('以前の音声です。', 'live/unit/group/entry/legacy'), added = clip('新しい音声です。', 'live/unit/group/example/stable-new/0')
  const manifest: Manifest = { version: 1, voice: audioVoice, modelVersion: '1.0.0', engineVersion: 'engine', generatedAt: '2026-10-29T00:00:00Z',
    complete: true, expectedClips: 2, lessonDates: [], clips: { [old.id]: old, [added.id]: added }, nonLessonSnapshot: { [old.references[0]]: old.id } }
  const sources: AudioSources = { version: 1, voice: audioVoice, modelVersion: '1.0.0', complete: false,
    sharedSource: { repository: 'https://github.com/kai987/japan-it-ai-daily', commit: 'a'.repeat(40) },
    providers: { daily: 'https://daily.example/', supabase: 'https://storage.example/' },
    clips: Object.fromEntries([old, added].map(item => [item.id, { provider: 'supabase' as const, path: `morioki-normal/${item.id}--${sha256}.mp3`, sha256, bytes: data.length, duration: item.duration }])),
    summary: { total: 2, reused: 0, uploads: 2, savedBytes: 0, uploadBytes: 2048 } }
  return { manifest, sources, old, added, data }
}

test('manual candidate bindings advance only in the verified remote result, preserving original proofs', async () => {
  const { manifest, sources, old, added, data } = fixture(), before = structuredClone({ manifest, sources })
  const reusedReference = 'live/unit/another-group/entry/stable-reuse'
  const catalog = { version: 1, voice: audioVoice, lessonDates: [], entries: [{ ...old, references: [...old.references, reusedReference] }, added] }
  const result = await verifyManualAudioPublication(manifest, sources, { publish: true, catalog, fetch: async () => new Response(data), sleep: async () => {}, now: '2026-10-30T00:00:00Z' })
  assert.equal(result.manifest.nonLessonSnapshot![old.references[0]], old.id)
  assert.equal(result.manifest.nonLessonSnapshot![added.references[0]], added.id)
  assert.equal(result.manifest.nonLessonSnapshot![reusedReference], old.id)
  assert.deepEqual(result.manifest.clips, manifest.clips)
  assert.equal(result.sources.complete, true)
  assert.equal(result.sources.verifiedAt, '2026-10-30T00:00:00Z')
  assert.equal(result.pending!.pendingClips, 0)
  assert.deepEqual({ manifest, sources }, before)
})

test('bad remote bytes and protected reference rebinds cannot produce a published manual snapshot', async () => {
  const { manifest, sources, old, added } = fixture(), before = structuredClone({ manifest, sources })
  await assert.rejects(verifyManualAudioPublication(manifest, sources, { publish: true, fetch: async () => new Response(Buffer.alloc(1024)), sleep: async () => {} }), /failed verification/)
  assert.deepEqual({ manifest, sources }, before)
  const changed = structuredClone(manifest)
  changed.clips[added.id].references.push(old.references[0])
  assert.throws(() => prepareManualAudioSnapshot(changed), /changed identity/)
  const missing = structuredClone(manifest)
  delete missing.clips[old.id]
  assert.throws(() => prepareManualAudioSnapshot(missing), /absent/)
  const reboundCatalog = { version: 1, voice: audioVoice, lessonDates: [], entries: [{ id: audioId('未収録の別の音声です。'), text: '未収録の別の音声です。', label: '別の音声', references: old.references }] }
  let requested = false
  await assert.rejects(verifyManualAudioPublication(manifest, sources, { publish: true, catalog: reboundCatalog,
    fetch: async () => { requested = true; throw new Error('must reject before GET') } }), /changed identity/)
  assert.equal(requested, false)
})

test('manual pending refresh preserves truly missing current speech, dates and complete references', async () => {
  const { manifest, sources, old, added, data } = fixture()
  const missing = { id: audioId('まだ未収録です。'), text: 'まだ未収録です。', label: '未収録', references: ['lesson/2026-10-30/title', 'live/new-unit/group/example/stable/0'] }
  const catalog = { version: 1, voice: audioVoice, lessonDates: ['2026-10-30', '2026-10-29'], entries: [old, added, missing] }
  const result = await verifyManualAudioPublication(manifest, sources, { publish: true, catalog, fetch: async () => new Response(data) })
  assert.deepEqual(result.pending, { version: 1, voice: audioVoice, requiredClips: 3, pendingClips: 1, incompleteLessonDates: ['2026-10-30'], entries: [missing] })
  assert.equal(result.manifest.nonLessonSnapshot![missing.references[1]], undefined)
})

test('manual metadata publication restores exact prior files if the second replacement fails', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-manual-publish-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const paths = [join(root, 'manifest.json'), join(root, 'sources.json')]
  const original = [' {"oldManifest":true}\n', '{"oldSources":true}\n']
  paths.forEach((path, index) => writeFileSync(path, original[index]))
  const { manifest, sources } = fixture()
  let calls = 0
  assert.throws(() => saveManualAudioPublication(paths[0], paths[1], manifest, sources, { rename: (source, destination) => {
    if (++calls === 2) throw new Error('second replacement failed')
    renameSync(source, destination)
  } }), /second replacement failed/)
  paths.forEach((path, index) => assert.equal(readFileSync(path, 'utf8'), original[index]))
  assert.deepEqual(readdirSync(root).sort(), ['manifest.json', 'sources.json'])
  saveManualAudioPublication(paths[0], paths[1], manifest, sources)
  assert.deepEqual(JSON.parse(readFileSync(paths[0], 'utf8')), manifest)
  assert.deepEqual(JSON.parse(readFileSync(paths[1], 'utf8')), sources)
})

test('verified manual publication never overwrites metadata changed while remote verification was running', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-manual-publish-stale-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const paths = [join(root, 'manifest.json'), join(root, 'sources.json'), join(root, 'pending.json')]
  const original = [Buffer.from('{"oldManifest":true}\n'), Buffer.from('{"oldSources":true}\n'), Buffer.from('{"pendingClips":1}\n')]
  paths.forEach((path, index) => writeFileSync(path, original[index]))
  const newer = '{"newerVerifiedRecording":"must survive"}\n'
  writeFileSync(paths[1], newer)
  const { manifest, sources } = fixture()
  assert.throws(() => saveManualAudioPublication(paths[0], paths[1], manifest, sources, {
    expected: { manifest: original[0], sources: original[1], pending: original[2] }, pending: { path: paths[2], value: { pendingClips: 0 } },
  }), /changed during verification/)
  assert.deepEqual(readFileSync(paths[0]), original[0])
  assert.equal(readFileSync(paths[1], 'utf8'), newer)
  assert.deepEqual(readFileSync(paths[2]), original[2])
  assert.deepEqual(readdirSync(root).sort(), ['manifest.json', 'pending.json', 'sources.json'])
})

test('pending queue joins the verified transaction and rolls back both earlier files if its replacement fails', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-manual-publish-pending-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const paths = [join(root, 'manifest.json'), join(root, 'sources.json'), join(root, 'pending.json')]
  const original = paths.map((_, index) => Buffer.from(JSON.stringify({ retained: index }) + '\n'))
  paths.forEach((path, index) => writeFileSync(path, original[index]))
  const { manifest, sources } = fixture()
  let calls = 0
  assert.throws(() => saveManualAudioPublication(paths[0], paths[1], manifest, sources, {
    pending: { path: paths[2], value: { pendingClips: 0 } }, rename(source, destination) {
      if (++calls === 3) throw new Error('pending replacement failed')
      renameSync(source, destination)
    },
  }), /pending replacement failed/)
  paths.forEach((path, index) => assert.deepEqual(readFileSync(path), original[index]))
  assert.deepEqual(readdirSync(root).sort(), ['manifest.json', 'pending.json', 'sources.json'])
})
