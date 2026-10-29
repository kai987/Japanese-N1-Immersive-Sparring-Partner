import test from 'node:test'
import assert from 'node:assert/strict'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'
import { createLessonSearchIndex, searchProject } from '../src/lib/projectSearch.ts'
import { validateContent } from '../scripts/validate-content.ts'
import { collectAudio } from '../scripts/collect-audio.ts'

const unitId = '2026-10-29'
const screenshotLines = [
  'どれだっけ', '空を飛ぶ', '海を泳ぐ', '公園を散歩する', '街を歩く', '廊下を走る',
  '氷の上を滑る', '橋を渡る', '駅前を通る', '導く＝道引く', '会議が長引く',
  '弄ぶ＝持って遊ぶ', '鉢合わせ', 'あっさり断る', 'きっぱり断る', 'やんわり断る',
  'おかしい喋り方をする', '変な食べ方してる', '変な持ち方してる', 'たかが',
  'てはならない 説教', 'てはいけない 規則', 'いけない 不允许', 'はぐくむ',
  '期待外れ', 'ちっとも', 'ファンタジー', 'サングラス', 'グラスを外す', 'そう見えるだけ',
  '山が見える', '山に見える', '音が聞こえる', 'ウソに聞こえる', '社畜のように見える',
]
const normalized = (text: string) => text.normalize('NFKC').replace(/\s+/g, '')

test('October 29 unit preserves all 35 unique screenshot lines as notes, with complete bilingual learning additions', () => {
  const unit = liveUnits.find(unit => unit.id === unitId)!
  assert.ok(unit)
  assert.equal(liveUnits[0].id, unitId)
  assert.equal(unit.date, '2026-10-29')
  assert.equal(new Set(screenshotLines).size, 35)
  const quotes = normalized(unit.groups.map(group => group.source?.quote ?? '').join('\n'))
  for (const line of screenshotLines) assert.ok(quotes.includes(normalized(line)), `Missing screenshot line: ${line}`)
  const expressions = unit.groups.flatMap(group => group.entries.map(entry => entry.expression))
  assert.equal(new Set(expressions).size, expressions.length, 'Overlapping screenshot expressions should not create duplicate entries')
  for (const group of unit.groups) {
    assert.ok(group.id.startsWith('live-2026-10-29-'))
    assert.equal(group.source?.kind, 'note')
    assert.ok(group.source?.label && group.source.quote && group.source.translation)
    assert.ok(group.entries.length && group.points.length && group.examples.length)
    for (const entry of group.entries) assert.ok(entry.expression.trim() && entry.reading.trim() && entry.meaning.trim())
    for (const example of group.examples) assert.ok(example.japanese.trim() && example.chinese.trim())
  }
})

test('new note searches cover Japanese, kana and Chinese and return the correct unit and group', () => {
  const unit = liveUnits.find(unit => unit.id === unitId)!
  const index = createLessonSearchIndex(validateContent().lessons, {})
  const vocabulary = unit.groups.flatMap(group => group.entries)
  const expectation = vocabulary.find(entry => entry.expression.includes('期待外れ'))!
  assert.ok(expectation)
  for (const query of ['山に見える', 'はぐくむ', expectation.meaning]) {
    const expected = unit.groups.filter(group => matchesLiveGroup(group, query))
    assert.ok(expected.length > 0, query)
    const results = searchProject(query, index).find(group => group.kind === 'live')!.results
    assert.ok(results.some(result => result.kind === 'live' && result.unitId === unitId && expected.some(group => group.id === result.groupId)), query)
  }
})

test('new notes automatically enter the shared audio catalog without changing daily lesson identities', () => {
  const catalog = collectAudio()
  assert.ok(catalog.entries.some(entry => entry.references.some(reference => reference.startsWith(`live/${unitId}/`))))
  for (const text of ['はぐくむ', 'そらをとぶ']) {
    assert.ok(catalog.entries.some(entry => entry.text === text && entry.references.some(reference => reference.startsWith(`live/${unitId}/`))), text)
  }
  const annotated = liveUnits.find(unit => unit.id === unitId)!.groups.find(group => group.id.endsWith('-prohibition'))!
  assert.equal(annotated.source!.readAloud, false)
  assert.equal(catalog.entries.some(entry => entry.references.includes(`live/${unitId}/${annotated.id}/source/0`)), false,
    'Raw source annotations are displayed but must not be synthesized as Japanese')
  assert.equal(catalog.entries.some(entry => entry.text.includes('不允许')), false)
  for (const term of ['てはならない', 'てはいけない', 'いけない']) {
    assert.ok(catalog.entries.some(entry => entry.text === term && entry.references.some(reference => reference.startsWith(`live/${unitId}/`))))
  }
})
