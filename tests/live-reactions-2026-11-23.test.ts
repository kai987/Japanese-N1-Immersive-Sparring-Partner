import assert from 'node:assert/strict'
import { test } from 'node:test'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { liveNovember23Groups } from '../src/data/live-reactions-2026-11-23.ts'

// Source completeness and identity regression for seven uploaded screenshots.
test('Nov 23 live notes are independently selectable, source-linked, and deduplicated', () => {
  assert.equal(liveUnits[0].id, '2026-11-23')
  assert.equal(liveUnits[0].groups, liveNovember23Groups)
  assert.equal(liveNovember23Groups.length, 23)
  const entries = liveNovember23Groups.flatMap(group => group.entries)
  const originals = entries.map(entry => entry.expression)
  assert.equal(new Set(originals).size, originals.length)
  assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length)
  const filenames = new Set(liveNovember23Groups.flatMap(group => group.source?.label.match(/IMG_\d+\.PNG/g) ?? []))
  assert.deepEqual([...filenames].sort(), ["IMG_3441.PNG","IMG_3447.PNG","IMG_3450.PNG","IMG_3454.PNG","IMG_3455.PNG","IMG_3456.PNG","IMG_3457.PNG"])
  for (const expression of [
    '多額の負債を返済する',
    '零式戦闘機はゼロ戦とも呼ばれる',
    '親族の葬式は来週の日曜日だ',
    '弁当を携えて出勤する',
    'うそを取り繕うのはよくない',
    '私に聞かれてもわからない',
  ]) assert.ok(originals.includes(expression), expression)
  for (const group of liveNovember23Groups) {
    assert.equal(group.source?.kind, 'note')
    assert.ok(group.source?.quote)
    assert.ok(group.examples.every(example => example.japanese && example.chinese))
  }
  const previous = liveUnits.find(unit => unit.id === '2026-11-18')
  assert.ok(previous)
  assert.notEqual(previous.groups, liveNovember23Groups)
  assert.equal(liveUnits[0].manga, previous.manga)
})
