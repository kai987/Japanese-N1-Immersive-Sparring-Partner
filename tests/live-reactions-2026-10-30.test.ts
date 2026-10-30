import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { liveEntryAudioReference, liveExampleAudioReference } from '../src/lib/liveIdentities.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'
import { createLessonSearchIndex, searchProject } from '../src/lib/projectSearch.ts'
import { validateContent } from '../scripts/validate-content.ts'
import { collectAudio } from '../scripts/collect-audio.ts'

const unitId = '2026-10-30'
// Independent transcription of the five provided photos, deduplicating overlap.
const screenshotLines = [
  '一部を抜き出す', '授業を抜け出す', 'きれいになる', '宝石みたいに綺麗だ', 'ガムを噛む',
  '出張させてあげる', '買ってあげる', '買わせてあげる', 'みんなに見せる',
  'いじめちゃいけない', 'いじめちゃだめだよ', 'そろそろ行かなくちゃ', 'いじめなくちゃ',
  'せっかく 難得', 'わざわざ作ってあげたのに', '庭の隅に植え替える', '隅から隅まで',
  'コーヒーでもどう', '日当たりのいい部屋', 'ご飯にする', 'それとも、还是', 'お風呂にする',
  'または', 'もしくは', 'あるいは', '来るかどうかわからない', 'AかB', '水をやる', 'エサをやる',
  'ドッグフードを食わされた', 'この間＝最近', 'のどがかわく', 'のどがカラカラ', '皮膚がかさかさ',
  'タッチパネル', 'ほっとく', 'わけがない', 'わけではない', 'わけにはいかない', '私には聞こえない',
  '自分から', '進んで', '好き好んで', '水まきをする', '怠ける', '怠け者', '深く考える',
  'めったにしない', 'たまには', 'ときどき', '常に＝いつも', '二度と行くもんか', 'また来ます', 'また、',
  '冬に備える', 'そのうち', 'いずれ', 'いまに', 'まもなく大阪です', '明日遅れないように',
  'のび太にならないように', 'せっせと勉強する', 'コツコツ頑張る', '気が変になる',
  '好き好んでやっているわけではない', 'ここだけの話なんだけど', '自分で言うのもあれなんだけど', '私はこう見えても',
]
const normalized = (text: string) => text.normalize('NFKC').replace(/\s+/gu, '')
const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('October 30 notes preserve all 68 unique visible lines, photo provenance and stable new identities', () => {
  const unit = liveUnits.find(unit => unit.id === unitId)!
  assert.ok(unit)
  assert.ok(liveUnits.indexOf(unit) < liveUnits.findIndex(unit => unit.id === '2026-10-29'))
  assert.equal(liveUnits[0].date, liveUnits.map(unit => unit.date).sort().at(-1))
  assert.equal(unit.date, unitId)
  assert.equal(new Set(screenshotLines).size, 68)
  const quotes = normalized(unit.groups.map(group => group.source?.quote ?? '').join('\n'))
  for (const line of screenshotLines) assert.ok(quotes.includes(normalized(line)), `Missing visible photo line: ${line}`)
  assert.ok(!quotes.includes('どれだっけ'), 'The already saved October 29 section of photo 1 must not be reimported')
  const labels = unit.groups.map(group => group.source?.label ?? '').join('\n')
  for (let index = 1; index <= 5; index++) assert.ok(labels.includes(`写真${index}.jpg`), `Missing photo ${index} provenance`)
  const entries = unit.groups.flatMap(group => group.entries)
  assert.equal(new Set(entries.map(entry => entry.expression)).size, entries.length, 'Overlapping photos must not duplicate entries')
  for (const group of unit.groups) {
    assert.ok(group.id.startsWith('live-2026-10-30-'))
    assert.equal(group.source?.kind, 'note')
    assert.ok(group.source?.quote && group.source.translation && group.source.label)
    assert.ok(group.entries.length && group.points.length && group.examples.length)
    for (const entry of group.entries) {
      assert.ok(entry.id.startsWith('live-2026-10-30-') && entry.expression && entry.reading && entry.meaning)
      assert.equal(entry.legacyAudioRef, undefined, 'New entries use their stable identity, not a legacy text alias')
      assert.equal(liveEntryAudioReference(entry), `entry/${entry.id}`)
    }
    for (const example of group.examples) {
      assert.ok(example.id.startsWith('live-2026-10-30-') && example.japanese && example.chinese)
      assert.equal(example.legacyAudioRef, undefined, 'New examples must not depend on their array position')
      assert.equal(liveExampleAudioReference(example), `example/${example.id}`)
    }
  }
  const extra = unit.groups.find(group => group.id.endsWith('-spoken-openers'))!
  assert.ok(extra.supplement)
  assert.ok(extra.source!.label.includes('写真1.jpg') && extra.source!.label.includes('写真5.jpg'))
  assert.match([unit.description, extra.source!.label, ...extra.points].join('\n'), /(?:无|未)[^。\n]{0,24}日期/u,
    'The four unheaded lines need an explicit uncertain-date provenance note')
})

test('Japanese, kana and Chinese note queries identify the new unit and exact matching group in global search', () => {
  const unit = liveUnits.find(unit => unit.id === unitId)!
  const index = createLessonSearchIndex(validateContent().lessons, {})
  const hottoku = unit.groups.find(group => group.id.endsWith('-hottoku'))!.entries[0]
  for (const query of ['買わせてあげる', 'うえかえる', hottoku.meaning]) {
    const expected = unit.groups.filter(group => matchesLiveGroup(group, query))
    assert.ok(expected.length > 0, query)
    const results = searchProject(query, index).find(group => group.kind === 'live')!.results
    assert.ok(results.some(result => result.kind === 'live' && result.unitId === unitId && expected.some(group => group.id === result.groupId)), query)
  }
})

test('every new speech binding is already published or durably queued, while source annotations are display-only', () => {
  const unit = liveUnits.find(unit => unit.id === unitId)!
  const catalog = collectAudio()
  const entries = catalog.entries.filter(entry => entry.references.some(reference => reference.startsWith(`live/${unitId}/`)))
  const bindings = new Map(entries.flatMap(entry => entry.references.map(reference => [reference, entry] as const)))
  const sources = json('../src/data/audio-sources.json')
  const pending = json('../src/data/audio-pending.json') as { entries: Array<{id: string; text: string; references: string[]}> }
  for (const group of unit.groups) {
    const prefix = `live/${unitId}/${group.id}`
    for (const entry of group.entries) assert.ok(bindings.has(`${prefix}/${liveEntryAudioReference(entry)}`), entry.id)
    for (const example of group.examples) assert.ok(bindings.has(`${prefix}/${liveExampleAudioReference(example)}/0`), example.id)
    if (/[＝=]|難得|还是/u.test(group.source!.quote)) {
      assert.equal(group.source!.readAloud, false, 'Inline translations and shorthand equivalence notes are not raw Japanese speech')
      assert.ok(!bindings.has(`${prefix}/source/0`))
    }
  }
  assert.ok(entries.length > 0)
  for (const entry of entries) {
    if (sources.complete && sources.clips[entry.id]) continue
    const queued = pending.entries.find(queued => queued.id === entry.id)
    assert.ok(queued, `Missing pending audio ${entry.id}`)
    assert.equal(queued.text, entry.text)
    for (const reference of entry.references) assert.ok(queued.references.includes(reference), `Missing queued reference ${reference}`)
  }
  assert.ok(entries.every(entry => !/難得|还是/u.test(entry.text)))
})
