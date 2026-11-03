import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { liveEntryAudioReference, liveExampleAudioReference } from '../src/lib/liveIdentities.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'
import { createLessonSearchIndex, searchProject } from '../src/lib/projectSearch.ts'
import { validateContent } from '../scripts/validate-content.ts'
import { collectAudio } from '../scripts/collect-audio.ts'

const unitId = '2026-11-03'
// Independent transcription of all three photos, with their repeated edges merged.
const screenshotLines = [
  'ブーメラン', 'わくわく', 'スリルを味わう', 'どきどき', 'はらはら', 'ぞくぞく',
  '通報する', '警察を呼ぶ', '読んだことのない漫画', '母の作った料理', '木を征服する',
  '口論する', 'カッとなる', 'つい', 'ついに', '知らないうちに', '知らず知らず',
  'いつの間にか', 'いつの間に＝いつ', 'それでも 即便如此', '歴史に残る出来事', '偉業',
  '勇気を褒め称える', 'わざわざ 特意', 'わざと 故意', 'わざとらしい身振り',
  'お世辞を言う', '人を呼び出す', '水を差す', '食べかけのケーキ', '容赦なく',
  '承知しない', '承諾しない', 'ラーメンが伸びる', 'すっかり', '投げると手元に帰ってくる',
  '自分をコントロールする', '瞬間移動', 'タイムスリップ', 'さっそく', 'てっぺん',
  'みんなに見せる', '目も眩む', '眩しい', '手がしびれる', '心臓麻ヒ', '皮フ科',
  '憂うつ', 'うつ病', '変なことに使うな', '右はし', 'ことの発端ほったん',
  '嬉しい 开心的', '楽しい 快乐的', '楽しむ 享受', '楽しみ 期待，快乐', '楽な仕事 轻松的',
  '気楽な作業', '眺めを楽しむ', '試合を楽しみにする', 'ピッタリ', 'タイミングを見計らう',
  '電気をつけたまま、寝てしまった', '三人ずつ部屋に入ってください', '少しずつ',
  '呼びに来る', 'チョロチョロ', '何もない', '誰もいない', '鏡に映る',
  'ぐずぐず', 'だらだら', 'まごまご', 'ボタンを押す',
]
const normalized = (text: string) => text.normalize('NFKC').replace(/[\s,，、]/gu, '')
const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const getUnit = () => liveUnits.find(unit => unit.id === unitId)!

test('November 3 notes preserve all 74 distinct source lines, provenance and stable speech identities', () => {
  const unit = getUnit()
  assert.ok(unit)
  assert.equal(unit.date, unitId)
  assert.ok(liveUnits.indexOf(unit) < liveUnits.findIndex(unit => unit.id === '2026-10-30'))
  assert.equal(new Set(screenshotLines).size, 74)
  const quotes = normalized(unit.groups.map(group => group.source?.quote ?? '').join('\n'))
  for (const line of screenshotLines) assert.ok(quotes.includes(normalized(line)), `Missing visible photo line: ${line}`)
  const labels = unit.groups.map(group => group.source?.label ?? '').join('\n')
  for (let index = 1; index <= 3; index++) assert.ok(labels.includes(`写真${index}.jpg`), `Missing photo ${index} provenance`)
  const entries = unit.groups.flatMap(group => group.entries)
  assert.equal(new Set(entries.map(entry => entry.expression)).size, entries.length, 'Photo overlap must not duplicate expression cards')
  for (const group of unit.groups) {
    assert.ok(group.id.startsWith('live-2026-11-03-'))
    assert.equal(group.source?.kind, 'note')
    assert.ok(group.source?.quote && group.source.translation && group.source.label)
    assert.ok(group.entries.length && group.points.length && group.examples.length)
    for (const entry of group.entries) {
      assert.ok(entry.id.startsWith('live-2026-11-03-') && entry.expression && entry.reading && entry.meaning)
      assert.equal(entry.legacyAudioRef, undefined)
      assert.equal(liveEntryAudioReference(entry), `entry/${entry.id}`)
    }
    for (const example of group.examples) {
      assert.ok(example.id.startsWith('live-2026-11-03-') && example.japanese && example.chinese)
      assert.equal(example.legacyAudioRef, undefined)
      assert.equal(liveExampleAudioReference(example), `example/${example.id}`)
    }
  }
})

test('Japanese, kana and Chinese searches return the November 3 unit and a matching knowledge group', () => {
  const unit = getUnit()
  const index = createLessonSearchIndex(validateContent().lessons, {})
  const boomerang = unit.groups.flatMap(group => group.entries).find(entry => entry.expression === 'ブーメラン')!
  for (const query of ['タイミングを見計らう', 'みはからう', boomerang.meaning]) {
    const expected = unit.groups.filter(group => matchesLiveGroup(group, query))
    assert.ok(expected.length, query)
    const results = searchProject(query, index).find(group => group.kind === 'live')!.results
    assert.ok(results.some(result => result.kind === 'live' && result.unitId === unitId && expected.some(group => group.id === result.groupId)), query)
  }
})

test('November 3 speech is published or fully queued and inline source glosses never become speech', () => {
  const unit = getUnit()
  const catalog = collectAudio()
  const entries = catalog.entries.filter(entry => entry.references.some(reference => reference.startsWith(`live/${unitId}/`)))
  const bindings = new Map(entries.flatMap(entry => entry.references.map(reference => [reference, entry] as const)))
  const sources = json('../src/data/audio-sources.json')
  const pending = json('../src/data/audio-pending.json') as { entries: Array<{ id: string; text: string; references: string[] }> }
  for (const group of unit.groups) {
    const prefix = `live/${unitId}/${group.id}`
    for (const entry of group.entries) assert.ok(bindings.has(`${prefix}/${liveEntryAudioReference(entry)}`), entry.id)
    for (const example of group.examples) assert.ok(bindings.has(`${prefix}/${liveExampleAudioReference(example)}/0`), example.id)
    if (/[＝=]|即便如此|特意|故意|开心的|快乐的|享受|期待|轻松的/u.test(group.source!.quote)) {
      assert.equal(group.source!.readAloud, false, 'Notebook glosses and shorthand are display-only')
      assert.ok(!bindings.has(`${prefix}/source/0`))
    }
  }
  assert.ok(entries.length)
  for (const entry of entries) {
    if (sources.complete && sources.clips[entry.id]) continue
    const queued = pending.entries.find(queued => queued.id === entry.id)
    assert.ok(queued, `Missing pending audio ${entry.id}`)
    assert.equal(queued.text, entry.text)
    for (const reference of entry.references) assert.ok(queued.references.includes(reference), `Missing queued reference ${reference}`)
  }
  assert.ok(entries.every(entry => !/即便如此|开心的|快乐的|轻松的/u.test(entry.text)))
})
