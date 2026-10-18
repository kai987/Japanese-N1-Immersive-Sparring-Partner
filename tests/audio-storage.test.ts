import assert from 'node:assert/strict'
import test from 'node:test'
import { dailyCandidates } from '../scripts/plan-audio-storage.ts'
import { audioId, audioVoice } from '../src/lib/audioText.ts'
import { audioPlaybackUrl, audioSources } from '../src/lib/audioSources.ts'

const source = 'public/audio/japanese/2026-10-18/manifest.json'
const manifest = {
  date: '2026-10-18', voice: { ...audioVoice, modelVersion: '1.0.0' },
  format: { container: 'mp3', sampleRate: 24000, channels: 1, bitrate: '96k' },
  settings: { wordSpeed: 1, exampleSpeed: 1, intonationScale: 1 },
  items: [{ term: '間に合う', reading: 'まにあう', word: 'vocab-01.mp3', wordSha256: 'a'.repeat(64), exampleJa: '締切に間に合いました。', example: 'example-01.mp3', exampleSha256: 'b'.repeat(64) }],
}
test('daily reuse matches complete spoken readings and sentences with immutable byte versions', () => {
  const candidates = dailyCandidates(manifest, source, '1.0.0')
  assert.deepEqual(candidates.map(item => item.text), ['まにあう', '締切に間に合いました。'])
  assert.equal(audioId(candidates[0].text), audioId('まにあう'))
  assert.notEqual(audioId(candidates[1].text), audioId('間に合いました。'))
  assert.equal(candidates[0].path, `japanese/2026-10-18/vocab-01--${'a'.repeat(64)}.mp3`)
})
test('another voice, model or playback speed cannot be silently deduplicated', () => {
  assert.equal(dailyCandidates({ ...manifest, voice: { ...manifest.voice, styleId: 1 } }, source, '1.0.0').length, 0)
  assert.equal(dailyCandidates(manifest, source, '2.0.0').length, 0)
  assert.equal(dailyCandidates({ ...manifest, settings: { ...manifest.settings, wordSpeed: .86, exampleSpeed: .86 } }, source, '1.0.0').length, 0)
})
test('historical reviews and unsafe or unversioned paths are not guessed as reusable recordings', () => {
  assert.equal(dailyCandidates({ ...manifest, items: manifest.items.map(item => ({ ...item, studyKind: 'review' })) }, source, '1.0.0').length, 0)
  assert.equal(dailyCandidates({ ...manifest, items: [{ ...manifest.items[0], word: '../vocab.mp3', exampleSha256: undefined }] }, source, '1.0.0').length, 0)
})
test('published playback URLs use the selected provider and remain independent of the Pages base path', () => {
  for (const provider of ['daily', 'supabase'] as const) {
    const entry = Object.entries(audioSources.clips).find(([, clip]) => clip.provider === provider)
    assert.ok(entry)
    assert.equal(audioPlaybackUrl(entry[0], '/nested-site/'), new URL(entry[1].path, audioSources.providers[provider]).href)
  }
})
