import assert from 'node:assert/strict'
import test from 'node:test'
import { createLessonSearchIndex, searchProject } from '../src/lib/projectSearch.ts'
import { validateContent } from '../scripts/validate-content.ts'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'
import { getSearchRanges } from '../src/lib/searchHighlight.ts'

const lessons = validateContent().lessons
const index = createLessonSearchIndex(lessons, {})

test('the serializable search index contains only navigation metadata and pre-normalized chunks', () => {
  assert.deepEqual(Object.keys(index[0].lesson).sort(), ['date', 'day', 'title'])
  assert.equal(Object.hasOwn(index[0].lesson, 'vocabulary'), false)
  for (const record of index) for (const chunk of record.chunks) {
    assert.equal(typeof chunk.normalized, 'string')
    assert.equal(typeof chunk.compact, 'string')
  }
  const restored = JSON.parse(JSON.stringify(index)) as typeof index
  assert.deepEqual(searchProject('ＡＰＩ', restored), searchProject('ＡＰＩ', index))
})

test('a new query scores prepared fields without reading every source string, and expansion reuses the ranking', () => {
  const prepared = createLessonSearchIndex([lessons[0]], {})
  const chunk = prepared[0].chunks[0]
  const original = chunk.compact
  let reads = 0
  Object.defineProperty(chunk, 'compact', { get: () => { reads++; return original }, configurable: true })
  Object.defineProperty(chunk, 'text', { get: () => { throw new Error('A non-match must not rescan original text') }, configurable: true })
  const query = 'zzzzzzzzzzzzzzzzzzzzzzzzzzz'
  assert.deepEqual(searchProject(query, prepared), [])
  assert.ok(reads > 0)
  const first = reads
  assert.deepEqual(searchProject(query, prepared, { limit: null }), [])
  assert.equal(reads, first, 'showing all results must reuse the already ranked query')
})

test('exact expression hits outrank incidental examples while every older matching group remains reachable', () => {
  const specific = searchProject('いけない', index).find(group => group.kind === 'live')!
  assert.equal(specific.results[0].kind, 'live')
  assert.equal(specific.results[0].kind === 'live' && specific.results[0].groupId, 'live-2026-10-29-prohibition')
  const expected = liveUnits.flatMap(unit => unit.groups.filter(group => matchesLiveGroup(group, 'ない'))).length
  assert.ok(expected > 4)
  const preview = searchProject('ない', index).find(group => group.kind === 'live')!
  const complete = searchProject('ない', index, { limit: null }).find(group => group.kind === 'live')!
  assert.equal(preview.results.length, 4)
  assert.equal(preview.total, expected)
  assert.equal(complete.total, expected)
  assert.equal(complete.results.length, expected)
  assert.deepEqual(complete.results.slice(0, 4), preview.results)
  assert.equal(new Set(complete.results.map(result => result.kind === 'live' && result.groupId)).size, expected)
  for (const result of complete.results) assert.ok(getSearchRanges(result.snippet, 'ない').length)
})

test('normalized kana and multi-term queries retain original navigation targets and safe snippets', () => {
  for (const query of ['はぐくむ', 'ﾌｧﾝﾀｼﾞｰ', '山に見える', '日语 不存在的查询']) {
    const result = searchProject(query, index, { limit: null })
    for (const group of result) for (const item of group.results) {
      assert.ok(getSearchRanges(item.snippet, query).length)
      if (item.kind === 'live') assert.ok(liveUnits.find(unit => unit.id === item.unitId)?.groups.some(group => group.id === item.groupId))
    }
  }
  assert.deepEqual(searchProject('　 ～ 〜 ', index, { limit: null }), [])
})
