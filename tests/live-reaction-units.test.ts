import test from 'node:test'
import assert from 'node:assert/strict'
import { liveReactionGroups } from '../src/data/live-reactions.ts'
import { liveCategories, liveUnits, liveUnitFromSearch } from '../src/data/live-reaction-units.ts'

test('second unit contains 25 core and three supplemental groups, with all four categories', () => {
  const unit = liveUnits[0]
  assert.equal(unit.id, '2026-09-30-okashi-bokuso')
  assert.equal(unit.groups.length, 28)
  assert.equal(unit.groups.filter(group => !group.supplement).length, 25)
  assert.equal(unit.groups.filter(group => group.supplement).length, 3)
  assert.equal(unit.groups.flatMap(group => group.entries).length, 47)
  assert.deepEqual(new Set(unit.groups.map(group => group.category)), new Set(liveCategories.map(item => item.id)))
  for (const group of unit.groups) {
    assert.ok(group.source?.quote && group.source.translation)
    assert.ok(group.entries.length && group.points.length && group.examples.length)
    for (const entry of group.entries) assert.ok(entry.expression && entry.reading && entry.meaning)
    for (const example of group.examples) assert.ok(example.japanese && example.chinese)
  }
})

test('legacy card payloads and IDs are preserved; new groups cannot collide', () => {
  const legacy = liveUnits.find(unit => unit.id === '2026-09-28')!
  assert.equal(legacy.groups.length, 15)
  assert.equal(legacy.groups.flatMap(group => group.entries).length, 64)
  assert.deepEqual(legacy.groups.map(({ category: _category, ...group }) => group), liveReactionGroups)
  const all = liveUnits.flatMap(unit => unit.groups.map(group => group.id))
  assert.equal(new Set(all).size, all.length)
})

test('source provenance separates phone notes from manga lines', () => {
  const groups = liveUnits[0].groups
  for (const suffix of ['exhaust', 'hatashite', 'request']) {
    assert.equal(groups.find(group => group.id.endsWith(`-${suffix}`))!.source!.kind, 'note')
  }
  assert.equal(groups.find(group => group.id.endsWith('-kau'))!.source!.kind, 'manga')
  assert.ok(groups.find(group => group.id.endsWith('-meguriau'))!.points.some(text => text.includes('不含“再次”')))
  assert.ok(liveUnits[0].description.includes('不是漫画出版或直播播出日期'))
})

test('unit URL resolution preserves a known unit and safely defaults invalid IDs', () => {
  assert.equal(liveUnitFromSearch('?live-unit=2026-09-28').id, '2026-09-28')
  for (const input of ['', '?live-unit=missing', '?live-unit=%3Cscript%3E']) {
    assert.equal(liveUnitFromSearch(input).id, '2026-09-30-okashi-bokuso')
  }
})
