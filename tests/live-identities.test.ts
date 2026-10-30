import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import type { LiveReactionExample } from '../src/data/live-reactions.ts'
import { liveEntryAudioReference, liveExampleAudioReference, liveUnitCountLabel, validateLiveIdentities } from '../src/lib/liveIdentities.ts'
import { collectAudio } from '../scripts/collect-audio.ts'

// Freeze the migration baseline to the units published before stable IDs were
// introduced. Later units must not change this proof or require legacy aliases.
const migrationIds = ['2026-10-29', '2026-09-30-okashi-bokuso', '2026-09-28']
const migrationUnits = liveUnits.filter(unit => migrationIds.includes(unit.id))

test('live identity migration preserves every prior group ID, teaching field and displayed count', () => {
  assert.deepEqual(migrationUnits.map(unit => unit.id), migrationIds)
  const previous = migrationUnits.map(unit => ({ ...unit, groups: unit.groups.map(group => ({ ...group,
    entries: group.entries.map(({ id: _id, legacyAudioRef: _legacy, ...entry }) => entry),
    examples: group.examples.map(({ id: _id, legacyAudioRef: _legacy, ...example }) => example),
  })) }))
  assert.equal(createHash('sha256').update(JSON.stringify(previous)).digest('hex'), 'dc58c5a98d62fdec3795570a3757ab371810caa13659ca6376447a85363c82bc')
  assert.doesNotThrow(() => validateLiveIdentities(liveUnits))
  for (const unit of liveUnits) assert.equal(unit.countLabel, liveUnitCountLabel(unit.groups))
})

test('reordering or inserting examples preserves existing explicit identities and published audio reference suffixes', () => {
  const group = migrationUnits[0].groups[0]
  const before = new Map(group.examples.map(example => [example.id, liveExampleAudioReference(example)]))
  const inserted: LiveReactionExample = { id: 'live-new-example', japanese: '新しい例文です。', chinese: '这是新增的例句。' }
  const reordered = [inserted, ...[...group.examples].reverse()]
  for (const example of reordered.slice(1)) assert.equal(liveExampleAudioReference(example), before.get(example.id))
  assert.equal(liveExampleAudioReference(inserted), 'example/live-new-example')
  const first = group.entries[0]
  assert.equal(liveEntryAudioReference({ id: 'new-stable-word', expression: '語彙', reading: 'ごい', meaning: '词汇' }), 'entry/new-stable-word')
  assert.equal(liveEntryAudioReference(first), 'entry/' + first.expression)
})

test('all existing live catalog references retain their original aliases and no index-only fallback is used', () => {
  const catalog = collectAudio()
  for (const unit of migrationUnits) for (const group of unit.groups) {
    const prefix = 'live/' + unit.id + '/' + group.id + '/'
    for (const entry of group.entries) {
      assert.ok(entry.id && entry.legacyAudioRef)
      assert.ok(catalog.entries.some(recording => recording.references.includes(prefix + liveEntryAudioReference(entry))))
    }
    for (const example of group.examples) {
      assert.ok(example.id && example.legacyAudioRef)
      assert.ok(catalog.entries.some(recording => recording.references.some(reference => reference.startsWith(prefix + liveExampleAudioReference(example) + '/'))))
    }
  }
})

test('live validation rejects duplicate IDs, duplicate legacy aliases, missing fields and malformed identities', () => {
  const duplicates = structuredClone(migrationUnits)
  duplicates[0].groups[0].examples[0].id = duplicates[0].groups[0].entries[0].id
  assert.throws(() => validateLiveIdentities(duplicates), /duplicate live example ID/)
  const aliases = structuredClone(migrationUnits)
  aliases[0].groups[0].examples[1].legacyAudioRef = aliases[0].groups[0].examples[0].legacyAudioRef
  assert.throws(() => validateLiveIdentities(aliases), /duplicate live audio reference/)
  const missing = structuredClone(migrationUnits)
  missing[0].groups[0].entries[0].reading = ''
  assert.throws(() => validateLiveIdentities(missing), /Incomplete live entry/)
  const malformed = structuredClone(migrationUnits)
  malformed[0].groups[0].entries[0].id = '../not-a-stable-id'
  assert.throws(() => validateLiveIdentities(malformed), /Invalid or duplicate live entry ID/)
})
