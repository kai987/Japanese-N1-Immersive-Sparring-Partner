import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import { createBrowserLessons } from '../scripts/lib/browserData.ts'
import { createNoteSearchData, createCompoundCatalog } from '../scripts/lib/noteSearchData.ts'
import { compoundVerbSeries } from '../src/data/compound-verbs.ts'
import { normalizeSearchText } from '../src/lib/searchHighlight.ts'
import { createLessonSearchIndex, searchProject, type LessonSearchIndex } from '../src/lib/projectSearch.ts'
import { decodeLessonSearchIndex, decodeProjectNotesIndex, packLessonSearchIndex, packProjectNotesIndex } from '../src/lib/searchIndexCodec.ts'

const data = createBrowserLessons()
const index = createLessonSearchIndex(data.lessons, data.reviewFocusByDate)
const packed = packLessonSearchIndex(index)
const notes = createNoteSearchData()

test('the compact wire format restores every original field and materially reduces the full-history payload', () => {
  const original = JSON.stringify(index), compact = JSON.stringify(packed)
  assert.deepEqual(decodeLessonSearchIndex(JSON.parse(compact)), index)
  assert.ok(Buffer.byteLength(compact) < Buffer.byteLength(original) * .65)
  assert.ok(gzipSync(compact).length < gzipSync(original).length * .8)
  assert.deepEqual(decodeLessonSearchIndex(JSON.parse(original)), index, 'retained version-1 releases remain readable')
})

test('search projection preserves note destinations, exact-match priority, reading queries and all-result expansion', () => {
  const restoredNotes = decodeProjectNotesIndex(JSON.parse(JSON.stringify(packProjectNotesIndex(notes))))
  assert.deepEqual(restoredNotes, notes)
  const restored = decodeLessonSearchIndex(packed)
  for (const query of ['ない', 'いけない', 'はぐくむ', 'ﾌｧﾝﾀｼﾞｰ', 'ＡＰＩ', '折り返す おりかえす', '期限', '　～〜', '不存在的查询']) {
    for (const limit of [4, null]) assert.deepEqual(searchProject(query, restored, { notes: restoredNotes, limit }), searchProject(query, index, { notes, limit }))
  }
  const empty: LessonSearchIndex = []
  assert.deepEqual(searchProject('いけない', empty), [])
  assert.ok(searchProject('いけない', empty, { notes: restoredNotes }).some(group => group.kind === 'live'), 'query caches distinguish independently available note indexes')
})

test('invalid wire versions, string references and navigation targets fail before search rendering', () => {
  for (const value of [{}, { ...packed, version: 99 }, { ...packed, strings: [null] }, { ...packed, lessons: [['2026-11-20', 83, -1, []]] },
    { version: 2, strings: ['unknown-section', 'anchor', 'label', 'text', 'normalized'], lessons: [['2026-11-20', 83, 2, [[0, 1, 2, 3, 4, 4, null]]]] }]) {
    assert.throws(() => decodeLessonSearchIndex(value), /Invalid search/)
  }
})

test('the initial compound catalog retains exact editorial word links without importing teaching bodies', () => {
  const catalog = createCompoundCatalog()
  for (const item of catalog) {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'title', 'words'])
    const original = compoundVerbSeries.find(series => series.id === item.id)!
    assert.deepEqual(item.words, [...new Set([...original.triggers, ...original.groups.flatMap(group => group.words.map(word => word.word))].map(normalizeSearchText))])
  }
  assert.ok(Buffer.byteLength(JSON.stringify(catalog)) < 10_000)
})
