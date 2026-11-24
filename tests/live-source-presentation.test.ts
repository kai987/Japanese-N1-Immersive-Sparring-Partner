import test from 'node:test'
import assert from 'node:assert/strict'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { getVisibleLiveSource, isRepeatedLiveSource, validateLiveSourcePresentation } from '../src/lib/liveSourcePresentation.ts'
import type { LiveUnitGroup } from '../src/data/live-reaction-units.ts'
import { liveGroupSearchFields, matchesLiveGroup } from '../src/lib/liveReactions.ts'
import { createProjectNotesIndex, searchProject } from '../src/lib/projectSearch.ts'

const group = (id: string) => {
  const found = liveUnits.flatMap(unit => unit.groups).find(group => group.id === id)
  assert.ok(found, id)
  return found
}

test('the reviewed units remove 224 repeated source blocks while retaining all 703 entries', () => {
  const reviewed: [string, number, number, number][] = [
    ['2026-09-28', 15, 64, 0], ['2026-09-30-okashi-bokuso', 28, 47, 25],
    ['2026-10-29', 16, 35, 0], ['2026-10-30', 32, 69, 0],
    ['2026-11-03', 32, 74, 0], ['2026-11-04', 24, 73, 0],
    ['2026-11-05', 25, 63, 0], ['2026-11-09', 11, 60, 0],
    ['2026-11-13', 29, 77, 0], ['2026-11-18', 40, 84, 0], ['2026-11-23', 23, 57, 0],
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
  assert.equal(hidden, 224)
  assert.equal(entries, 703)
})

test('approved legacy independent context survives; new groups archive sources by default', () => {
  for (const id of ['kau', 'monka', 'hatashite', 'atarimae']) {
    const item = group(`live-2026-09-30-${id}`)
    assert.equal(getVisibleLiveSource(item), item.source)
    assert.equal(getVisibleLiveSource({ ...item, id: 'live-future-unreviewed' }), undefined)
  }
  const exact = group('live-2026-09-30-yashinai')
  assert.equal(getVisibleLiveSource(exact), undefined)
  assert.equal(getVisibleLiveSource({ ...exact, id: 'live-new-context' }), undefined)
  assert.equal(getVisibleLiveSource({ id: 'without-source', entries: [], examples: [] }), undefined)
})

test('new dates, source kinds and opt-in cannot reintroduce duplicated source blocks', () => {
  const original = group('live-2026-11-23-no-effect')
  assert.equal(original.source?.quote, '私には効かない\\n効き目がない')
  const before = JSON.stringify(original)
  for (const kind of ['note', 'manga'] as const) {
    const future = { ...original, id: 'live-2099-01-01-unseen', source: {
      ...original.source!, kind, quote: '私には効かない。　効き目がない！',
    } }
    assert.equal(isRepeatedLiveSource(future), true)
    assert.equal(getVisibleLiveSource(future), undefined)
    const invalid = { ...future, source: { ...future.source, contextReason: 'not actually additional context' } }
    assert.equal(getVisibleLiveSource(invalid), undefined)
    assert.throws(() => validateLiveSourcePresentation([{ groups: [invalid] }]), /Repeated live source/)
    const kana = { ...future, source: { ...future.source, quote: 'わたしにはきかない、ききめがない' } }
    assert.equal(isRepeatedLiveSource(kana), true)
    const copiedExample = { ...future, source: { ...future.source, quote: original.examples[0].japanese } }
    assert.equal(isRepeatedLiveSource(copiedExample), true)
  }
  assert.equal(JSON.stringify(original), before)
})

test('only explicitly justified, independent new quotations may be visible and searchable', () => {
  const original = group('live-2026-11-23-no-effect')
  const quote = 'この腕章は、子どもには効かないのか。'
  const independent: LiveUnitGroup = { ...original, id: 'live-2099-01-01-context', source: {
    kind: 'manga', label: 'test context', quote, translation: '这枚袖章对孩子不起作用吗？',
  } }
  assert.equal(isRepeatedLiveSource(independent), false)
  assert.equal(getVisibleLiveSource(independent), undefined)
  assert.equal(liveGroupSearchFields(independent).includes(quote), false)
  const optedIn = { ...independent, source: { ...independent.source!, contextReason: 'Provides the object and question context absent from the card.' } }
  assert.doesNotThrow(() => validateLiveSourcePresentation([{ groups: [optedIn] }]))
  assert.equal(getVisibleLiveSource(optedIn), optedIn.source)
  assert.ok(liveGroupSearchFields(optedIn).includes(quote))
  const emptyReason = { ...optedIn, source: { ...optedIn.source, contextReason: ' ' } }
  assert.throws(() => validateLiveSourcePresentation([{ groups: [emptyReason] }]), /non-empty reason/)
})

test('every registered unit obeys the date-independent archive-by-default invariant', () => {
  assert.doesNotThrow(() => validateLiveSourcePresentation(liveUnits))
  for (const unit of liveUnits) for (const item of unit.groups) {
    const visible = getVisibleLiveSource(item)
    if (unit.id !== '2026-09-30-okashi-bokuso' && !item.source?.contextReason) {
      assert.equal(visible, undefined, item.id)
    }
    if (visible) assert.equal(isRepeatedLiveSource(item), false, item.id)
    if (item.source && !visible) {
      assert.equal(liveGroupSearchFields(item).slice(-2).includes(item.source.quote) && liveGroupSearchFields(item).slice(-2).includes(item.source.translation), false, item.id)
    }
  }
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
