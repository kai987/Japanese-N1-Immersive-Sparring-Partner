import test from 'node:test'
import assert from 'node:assert/strict'
import { compoundVerbSeries } from '../src/data/compound-verbs.ts'
import { getCompoundSeriesForWord, searchCompoundSeries } from '../src/lib/compoundVerbs.ts'

const ids = (series: typeof compoundVerbSeries) => series.map(item => item.id)

test('compound series have complete bilingual examples and valid cross references', () => {
  const knownIds = new Set(compoundVerbSeries.map(series => series.id))
  assert.equal(knownIds.size, compoundVerbSeries.length)
  assert.ok(compoundVerbSeries.length >= 3)
  for (const series of compoundVerbSeries) {
    assert.match(series.id, /^[a-z][a-z0-9-]*$/)
    for (const text of [series.title, series.subtitle, series.summary, series.structure]) assert.ok(text.trim(), series.id)
    assert.ok(series.notes.length, `${series.id}: distinctions are missing`)
    assert.ok(series.groups.length, `${series.id}: words are missing`)
    assert.ok(series.sources.length, `${series.id}: sources are missing`)
    for (const source of series.sources) {
      assert.ok(source.title.trim())
      assert.equal(new URL(source.url).protocol, 'https:')
    }
    for (const related of series.relatedSeriesIds) {
      assert.ok(knownIds.has(related), `${series.id}: unknown related series ${related}`)
      assert.notEqual(related, series.id)
    }
    const words = series.groups.flatMap(group => group.words)
    assert.equal(new Set(words.map(word => word.word)).size, words.length, `${series.id}: duplicate word`)
    for (const word of words) {
      for (const text of [word.word, word.reading, word.meaning, word.example, word.translation]) {
        assert.ok(text.trim(), `${series.id}: incomplete word ${word.word}`)
      }
    }
  }
})

test('間に合う links to both expression structure and time topics while unrelated vocabulary stays untagged', () => {
  assert.deepEqual(ids(getCompoundSeriesForWord('間に合う')), ['au', 'time-quantity'])
  assert.deepEqual(ids(getCompoundSeriesForWord('　間 に 合う\t')), ['au', 'time-quantity'])
  assert.ok(ids(getCompoundSeriesForWord('話し合う')).includes('au'))
  for (const word of ['相殺する', '合う', '間', '間に合うかどうか', '時間に間に合う', '']) {
    assert.deepEqual(getCompoundSeriesForWord(word), [], `${word} must not inherit a substring tag`)
  }
})

test('間に合う is distinguished from reciprocal verb plus 合う compounds', () => {
  const series = compoundVerbSeries.find(item => item.id === 'au')!
  const fixed = series.groups.find(group => group.words.some(word => word.word === '間に合う'))!
  const reciprocal = series.groups.find(group => group.words.some(word => word.word === '話し合う'))!
  assert.ok(fixed)
  assert.ok(reciprocal)
  assert.notEqual(fixed, reciprocal)
  assert.match([fixed.title, fixed.description, ...series.notes].join(' '), /固定|助詞|名詞/)
  assert.match([reciprocal.title, reciprocal.description].join(' '), /相互|共同|互い/)
})

test('series search finds Japanese words, readings and Chinese meanings without matching arbitrary text', () => {
  assert.deepEqual(ids(searchCompoundSeries(' \t ')), ids(compoundVerbSeries))
  for (const query of ['間に合う', 'まにあう']) {
    assert.ok(ids(searchCompoundSeries(query)).includes('au'), query)
    assert.ok(ids(searchCompoundSeries(query)).includes('time-quantity'), query)
  }
  assert.ok(searchCompoundSeries('相互').length)
  const maniau = compoundVerbSeries.find(series => series.id === 'au')!.groups
    .flatMap(group => group.words).find(word => word.word === '間に合う')!
  assert.ok(ids(searchCompoundSeries(maniau.meaning)).includes('au'))
  assert.deepEqual(searchCompoundSeries('不存在的复合动词 zzz-no-match'), [])
})
