// Focus on corruption that a passing production snapshot cannot exercise.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { audioId, audioVoice, normalizeAudioText } from '../../src/lib/audioText.ts'

const crate = join(import.meta.dirname, 'Cargo.toml')
execFileSync('cargo', ['build', '--locked', '--release', '--manifest-path', crate], { stdio: 'inherit' })
const root = mkdtempSync(join(tmpdir(), 'n1-rust-fixtures-'))
after(() => rmSync(root, { recursive: true, force: true }))
for (const dir of ['src/data', 'public/audio/morioki-normal']) mkdirSync(join(root, dir), { recursive: true })
const save = (path, doc) => writeFileSync(join(root, path), JSON.stringify(doc))
const file = Buffer.alloc(1024, 3)
const digest = createHash('sha256').update(file).digest('hex')
const ref = 'live/test/source/0'
const entry = { id: audioId('𠮷野家😀 ｶﾞ'), text: normalizeAudioText('𠮷野家😀 ｶﾞ'), label: '語', references: [ref] }
const clip = { ...entry, bytes: file.length, duration: 1, rms: 0.02, sha256: digest }
const record = {
  provider: 'supabase',
  bytes: clip.bytes,
  duration: clip.duration,
  sha256: digest,
  path: 'morioki-normal/' + clip.id + '--' + digest + '.mp3'
}
const common = { version: 1, voice: audioVoice }
const fixtures = {
  'plan.json': { ...common, entries: [entry] },
  'public/audio/manifest.json': {
    ...common,
    modelVersion: '1',
    expectedClips: 1,
    complete: true,
    lessonDates: [],
    clips: { [entry.id]: clip },
    nonLessonSnapshot: { [ref]: entry.id }
  },
  'src/data/audio-index.json': { ...common, clips: { [entry.id]: 1 } },
  'src/data/audio-sources.json': {
    ...common,
    modelVersion: '1',
    complete: true,
    verifiedAt: '2026-11-22T00:00:00Z',
    sharedSource: { commit: 'a'.repeat(40) },
    providers: { supabase: 'https://example.org/media/' },
    clips: { [entry.id]: record },
    summary: { total: 1, reused: 0, uploads: 1, savedBytes: 0, uploadBytes: file.length }
  }
}
function setup() {
  for (const [path, doc] of Object.entries(fixtures)) save(path, doc)
}
function check(valid, pattern) {
  const p = spawnSync(
    'cargo',
    [
      'run',
      '--locked',
      '--release',
      '--quiet',
      '--manifest-path',
      crate,
      '--',
      '--root',
      root,
      '--catalog',
      join(root, 'plan.json')
    ],
    { encoding: 'utf8' }
  )
  assert.equal(p.status, valid ? 0 : 1, p.stderr + p.stdout)
  const report = JSON.parse(p.stdout)
  assert.equal(report.valid, valid)
  if (pattern) assert.match(report.error, pattern)
  return report
}
test('canonical export retains UTF-16 identities and hashes present local bytes', () => {
  setup()
  assert.equal(check(true).localFilesHashed, 0)
  const path = join(root, 'public/audio/morioki-normal', entry.id + '.mp3')
  writeFileSync(path, file)
  assert.equal(check(true).localFilesHashed, 1)
  writeFileSync(path, Buffer.alloc(file.length))
  check(false, /local file differs/)
  rmSync(path)
})
test('rejects duplicate IDs, conflicting references and a changed immutable path', () => {
  setup()
  save('plan.json', { ...common, entries: [entry, entry] })
  check(false, /duplicate catalog ID/)
  save('plan.json', { ...common, entries: [entry, { ...entry, text: '本', id: audioId('本') }] })
  check(false, /conflicting catalog reference/)
  setup()
  const path = 'src/data/audio-sources.json',
    doc = structuredClone(fixtures[path])
  doc.clips[entry.id].path = '../bad.mp3'
  save(path, doc)
  check(false, /immutable object mismatch/)
})
test('queued supplementary speech passes snapshot coverage and an unqueued new reference fails', () => {
  setup()
  const next = { ...entry, text: '本', id: audioId('本'), references: ['compound/test/book/word'] }
  save('plan.json', { ...common, entries: [entry, next] })
  check(false, /not queued/)
  save('src/data/audio-pending.json', { ...common, requiredClips: 2, pendingClips: 1, entries: [next] })
  assert.deepEqual(check(true).missingIds, [next.id])
})

test('duplicate JSON keys and invalid protected bindings cannot mask corruption', () => {
  setup()
  const path = 'src/data/audio-index.json'
  const raw = JSON.stringify(fixtures[path])
  writeFileSync(join(root, path), raw.replace('"' + clip.id + '":1', '"' + clip.id + '":2,"' + clip.id + '":1'))
  check(false, /duplicate key/)
  setup()
  const manifestPath = 'public/audio/manifest.json'
  save(manifestPath, {...fixtures[manifestPath], nonLessonSnapshot: {}})
  check(false, /missing protected binding/)
})
