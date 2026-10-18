import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mergeSharedAudio } from '../scripts/sync-audio.ts'
import { verifyAudioChangedPaths, audioMetadataPaths } from '../scripts/verify-audio-changed-paths.ts'
import { audioId, audioVoice } from '../src/lib/audioText.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'
import type { Manifest } from '../scripts/validate-audio.ts'

const entry = (text: string, date: string) => ({ id: audioId(text), text, label: text, references: [`lesson/${date}/title`] })
const old = entry('既存です。', '2026-10-18'), shared = entry('共有します。', '2026-10-19'), unique = entry('新しい読解です。', '2026-10-19')
const sha = 'a'.repeat(64), commit = 'b'.repeat(40), now = '2026-10-19T00:00:00.000Z'
const oldClip = { ...old, bytes: 1024, sha256: sha, duration: 1, rms: .1 }
const manifest: Manifest = { version: 1, voice: audioVoice, engineVersion: '1.1.0-dev', modelVersion: '1.0.0', generatedAt: now, complete: true, expectedClips: 1, lessonDates: ['2026-10-18'], clips: { [old.id]: oldClip } }
const index = { version: 1, voice: audioVoice, clips: { [old.id]: 1 } }
const sources: AudioSources = { version: 1, voice: audioVoice, modelVersion: '1.0.0', complete: true, verifiedAt: now,
  sharedSource: { repository: 'https://github.com/kai987/japan-it-ai-daily', commit },
  providers: { daily: 'https://example.com/', supabase: 'https://example.com/storage/' },
  summary: { total: 1, reused: 0, uploads: 1, uploadBytes: 1024, savedBytes: 0 },
  clips: { [old.id]: { provider: 'supabase', path: `morioki-normal/${old.id}--${sha}.mp3`, sha256: sha, bytes: 1024, duration: 1 } } }
const catalog = { version: 1, voice: audioVoice, lessonDates: ['2026-10-19', '2026-10-18'], entries: [old, shared, unique] }
const verified = { [shared.id]: { candidate: { text: shared.text, path: `japanese/2026-10-19/example-01--${sha}.mp3`, sha256: sha, manifest: 'manifest.json', date: '2026-10-19' }, bytes: 2048, duration: 2, rms: .1 } }

test('daily audio sync reuses verified speech, preserves hosted history and queues unique N1 sentences', () => {
  const result = mergeSharedAudio(catalog, manifest, index, sources, verified, commit, now)
  assert.equal(result.added, 1)
  assert.deepEqual(result.sources.clips[old.id], sources.clips[old.id])
  assert.equal(result.sources.clips[shared.id].provider, 'daily')
  assert.deepEqual(result.pending.entries, [unique])
  assert.deepEqual(result.pending.incompleteLessonDates, ['2026-10-19'])
  assert.deepEqual(result.manifest.lessonDates, ['2026-10-18'])
  assert.equal(result.manifest.expectedClips, 2)
  assert.equal(result.manifest.complete, true)
  assert.equal(manifest.expectedClips, 1, 'input snapshot remains untouched')
  const repeated = mergeSharedAudio(catalog, result.manifest, result.index, result.sources, {}, commit, '2026-10-20T00:00:00Z')
  assert.equal(repeated.added, 0)
  assert.deepEqual(repeated.sources, result.sources, 'no timestamp-only commits')
  assert.deepEqual(repeated.manifest, result.manifest)
})
test('audio sync never guesses an unverified or differently worded recording', () => {
  const result = mergeSharedAudio(catalog, manifest, index, sources, {}, commit, now)
  assert.equal(result.added, 0)
  assert.equal(result.pending.pendingClips, 2)
  assert.throws(() => mergeSharedAudio(catalog, manifest, index, sources, { [shared.id]: { ...verified[shared.id], candidate: { ...verified[shared.id].candidate, text: '違う文です。' } } }, commit, now))
  assert.throws(() => mergeSharedAudio(catalog, manifest, index, sources, verified, 'main', now))
})
test('audio-only commits reject teaching content, source, workflows, MP3s and empty changes', () => {
  assert.deepEqual(verifyAudioChangedPaths(audioMetadataPaths.join('\n')), audioMetadataPaths)
  for (const path of ['src/data/daily/2026-10-19.json', 'src/data/it-study-snapshot.json', '.github/n1-sync-request.json', 'n1-source/2026-10-19.md', 'public/audio/test.mp3', '']) assert.throws(() => verifyAudioChangedPaths(path))
})
test('deleted local cache does not cause hosted history to be synthesized again', () => {
  execFileSync('python3', ['-c', `
import importlib.util, pathlib, tempfile
spec = importlib.util.spec_from_file_location('n1_generate', 'scripts/generate-audio.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
entry = {'id': 'a', 'text': '共有します。'}
old = {**entry, 'sha256': 'a'*64, 'bytes': 1024}
with tempfile.TemporaryDirectory() as directory:
    path = pathlib.Path(directory) / 'deleted.mp3'
    assert module.reusable_clip(entry, old, path, True, {'a': {'provider': 'daily'}})
    assert module.reusable_clip(entry, old, path, True, {'a': {'provider': 'supabase', 'sha256': 'a'*64, 'bytes': 1024}})
    assert not module.reusable_clip(entry, old, path, True, {'a': {'provider': 'supabase', 'sha256': 'b'*64, 'bytes': 1024}})
    assert not module.reusable_clip(entry, old, path, False, {'a': {'provider': 'daily'}})
    assert not module.reusable_clip({**entry, 'text': '変更しました。'}, old, path, True, {'a': {'provider': 'daily'}})
    assert not module.reusable_clip(entry, old, path, True, {})
assert not module.hosted_cache_matches({'voice': {}, 'modelVersion': '1'}, {'voice': {}, 'modelVersion': '1', 'complete': False})
`], { cwd: new URL('../', import.meta.url), stdio: 'pipe' })
})
test('audio follow-up is separate from the text writer and deploys only metadata changes', () => {
  const workflow = readFileSync(new URL('../.github/workflows/sync-n1-audio.yml', import.meta.url), 'utf8')
  assert.match(workflow, /workflow_run:/)
  assert.match(workflow, /conclusion == 'success'/)
  assert.match(workflow, /head_repository.full_name == github.repository/)
  assert.match(workflow, /group: n1-content-sync\s+cancel-in-progress: false/)
  assert.match(workflow, /test "\$\(git rev-parse origin\/main\)" = "\$base"/)
  assert.match(workflow, /if: steps.commit.outputs.changed == 'true'/)
  assert.doesNotMatch(workflow, /git push[^\n]*(?:--force| -f\b)/)
})
