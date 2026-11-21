import test from 'node:test'
import assert from 'node:assert/strict'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { getVisibleLiveSource } from '../src/lib/liveSourcePresentation.ts'
import { liveGroupSearchFields, matchesLiveGroup } from '../src/lib/liveReactions.ts'
import { createProjectNotesIndex, searchProject } from '../src/lib/projectSearch.ts'

const group = (id: string) => {
  const found = liveUnits.flatMap(unit => unit.groups).find(group => group.id === id)
  assert.ok(found, id)
  return found
}

test('the reviewed units remove 201 repeated source blocks while retaining all 646 entries', () => {
  const reviewed: [string, number, number, number][] = [
    ['2026-09-28', 15, 64, 0], ['2026-09-30-okashi-bokuso', 28, 47, 25],
    ['2026-10-29', 16, 35, 0], ['2026-10-30', 32, 69, 0],
    ['2026-11-03', 32, 74, 0], ['2026-11-04', 24, 73, 0],
    ['2026-11-05', 25, 63, 0], ['2026-11-09', 11, 60, 0],
    ['2026-11-13', 29, 77, 0], ['2026-11-18', 40, 84, 0],
  ]
  let hidden = 0, entries = 0
  for (const [id, groupCount, entryCount, sourceCount] of reviewed) {
    const unit = liveUnits.find(unit => unit.id === id)!
    assert.ok(unit, id)
    assert.equal(unit.groups.length, groupCount, id)
    assert.equal(unit.groups.reduce((sum, group) => sum + group.entries.length, 0), entryCount, id)
    assert.equal(unit.groups.filter(group => getVisibleLiveSource(group)).length, sourceCount, id)
    hidden += unit.groups.filter(group => group.source && !getVisibleLiveSource(group)).length
    entries += entryCount
  }
  assert.equal(hidden, 201)
  assert.equal(entries, 646)
})

test('independent manga context and complete note sentences remain visible, and new groups default to visible', () => {
  for (const id of ['kau', 'monka', 'hatashite', 'atarimae']) {
    const item = group(`live-2026-09-30-${id}`)
    assert.equal(getVisibleLiveSource(item), item.source)
  }
  const exact = group('live-2026-09-30-yashinai')
  assert.equal(getVisibleLiveSource(exact), undefined)
  assert.equal(getVisibleLiveSource({ ...exact, id: 'live-new-context' }), exact.source)
  assert.equal(getVisibleLiveSource({ id: 'without-source' }), undefined)
})

test('source-only wording cannot create invisible search hits, while retained expressions and context stay searchable', () => {
  const item = group('live-2026-10-30-extract')
  const original = JSON.stringify(item)
  const notes = createProjectNotesIndex([], liveUnits)
  const fields = liveGroupSearchFields(item)
  assert.equal(fields.includes(item.source!.quote), false)
  assert.equal(fields.includes(item.source!.translation), false)
  assert.equal(matchesLiveGroup(item, item.source!.translation), false)
  assert.deepEqual(searchProject(item.source!.translation, [], { notes, limit: null }), [])
  for (const query of ['一部を抜き出す', 'いちぶをぬきだす', '摘出、抽取其中一部分']) {
    assert.equal(matchesLiveGroup(item, query), true)
    assert.ok(searchProject(query, [], { notes, limit: null }).flatMap(section => section.results)
      .some(result => result.kind === 'live' && result.groupId === item.id), query)
  }
  const manga = group('live-2026-09-30-kau')
  assert.ok(liveGroupSearchFields(manga).includes(manga.source!.quote))
  assert.ok(searchProject(manga.source!.quote, [], { notes, limit: null }).flatMap(section => section.results)
    .some(result => result.kind === 'live' && result.groupId === manga.id))
  assert.equal(JSON.stringify(item), original, 'display and search must not change the archived source or identities')
})

test('note annotations and spelling corrections remain visible below the removed source', () => {
  for (const [id, terms] of [
    ['live-2026-10-29-prohibition', ['不允许', '規則', '説教']],
    ['live-2026-10-30-sekkaku-wazawaza', ['難得']],
    ['live-2026-11-03-unnoticed', ['いつの間に＝いつ']],
    ['live-2026-11-04-location-and-eco', ['環境にやかしい家電製品', '環境にやさしい家電製品']],
  ] as const) {
    const item = group(id)
    assert.equal(getVisibleLiveSource(item), undefined)
    const visible = liveGroupSearchFields(item).join('\n')
    for (const term of terms) assert.ok(visible.includes(term), `${id}: ${term}`)
    assert.ok(!visible.includes('下方保留笔记原文'))
  }
})
