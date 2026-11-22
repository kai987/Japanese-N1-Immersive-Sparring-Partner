// Optional side-by-side gate. The supported Node exporter owns speech normalization.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectAudio } from '../../scripts/collect-audio.ts'
import { validateAudio, validateAudioSources } from '../../scripts/validate-audio.ts'
import { audioSources } from '../../src/lib/audioSources.ts'
import { audioId } from '../../src/lib/audioText.ts'

const dir = mkdtempSync(join(tmpdir(), 'n1-audio-compare-'))
try {
  const catalog = collectAudio()
  const manifest = JSON.parse(readFileSync('public/audio/manifest.json'))
  const snapshot = validateAudio()
  const catalogFile = join(dir, 'catalog.json')
  writeFileSync(catalogFile, JSON.stringify(catalog))
  const raw = execFileSync(
    'cargo',
    [
      'run',
      '--locked',
      '--release',
      '--quiet',
      '--manifest-path',
      'tools/n1-tool/Cargo.toml',
      '--',
      '--catalog',
      catalogFile
    ],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  )
  const report = JSON.parse(raw)
  assert.equal(report.valid, true)
  for (const key of ['clips', 'expected', 'bytes', 'missing', 'hosted']) assert.equal(report[key], snapshot[key], key)
  const missing = catalog.entries.filter((e) => !manifest.clips[e.id]).map((e) => e.id)
  assert.deepEqual(report.missingIds, missing)
  assert.equal(
    report.references,
    catalog.entries.reduce((n, e) => n + e.references.length, 0)
  )
  if (audioSources.complete)
    assert.deepEqual(report.dedup, { total: report.hosted, ...validateAudioSources(manifest, audioSources) })
  for (const clip of [...catalog.entries, ...Object.values(manifest.clips)]) assert.equal(clip.id, audioId(clip.text))
  console.log(JSON.stringify({ parity: true, ...report }))
} finally {
  rmSync(dir, { recursive: true, force: true })
}
