import test from 'node:test'
import assert from 'node:assert/strict'
import { getSearchRanges } from '../src/lib/searchHighlight.ts'

test('search highlights full-width Latin text and ignores case without changing source offsets', () => {
  assert.deepEqual(getSearchRanges('ＡＰＩ api Api', 'aPi'), [
    { start: 0, end: 3 }, { start: 4, end: 7 }, { start: 8, end: 11 },
  ])
})

test('search maps composed half-width and combining kana back to their complete original spans', () => {
  const halfWidth = '入力はｶﾞｲﾄﾞを確認する'
  const start = halfWidth.indexOf('ｶﾞｲﾄﾞ')
  assert.deepEqual(getSearchRanges(halfWidth, 'ガイド'), [{ start, end: start + 'ｶﾞｲﾄﾞ'.length }])
  assert.deepEqual(getSearchRanges('カ\u3099イド', 'ｶﾞｲﾄﾞ'), [{ start: 0, end: 4 }])
})

test('search offsets use UTF-16 indices so emoji adjacent to Japanese text remain intact', () => {
  const text = '📘かみ合う😀かみ合う'
  const ranges = getSearchRanges(text, 'かみ合う')
  assert.deepEqual(ranges, [{ start: 2, end: 6 }, { start: 8, end: 12 }])
  assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), ['かみ合う', 'かみ合う'])
  assert.deepEqual(getSearchRanges(text, '😀'), [{ start: 6, end: 8 }])
})

test('search ignores source whitespace and construction waves while preserving the full matched span', () => {
  assert.deepEqual(getSearchRanges('間 に　合う', '～間に合う〜'), [{ start: 0, end: 6 }])
  assert.deepEqual(getSearchRanges('～合う・〜合う', '合う'), [{ start: 1, end: 3 }, { start: 5, end: 7 }])
  for (const query of ['', ' \t\n　', '～ 〜']) assert.deepEqual(getSearchRanges('間に合う', query), [])
})

test('search highlights each query term and merges overlapping matches into one safe span', () => {
  assert.deepEqual(getSearchRanges('話し合う・間に合う', '間に合う 話し合う'), [
    { start: 0, end: 4 }, { start: 5, end: 9 },
  ])
  assert.deepEqual(getSearchRanges('話し合う・支え合う', '話し合う 合う'), [
    { start: 0, end: 4 }, { start: 7, end: 9 },
  ])
  assert.deepEqual(getSearchRanges('話し合う', '話し合う 話し合う 合う'), [{ start: 0, end: 4 }])
})

test('regex and HTML-like search terms are interpreted as literal text', () => {
  for (const query of ['[test].*?', '(a+b)', '$^', '<script>']) {
    const text = `前 ${query} 後`
    assert.deepEqual(getSearchRanges(text, query), [{ start: 2, end: 2 + query.length }])
  }
  assert.deepEqual(getSearchRanges('abc', '.*'), [])
  assert.deepEqual(getSearchRanges('abc', '['), [])
})


test('series matches come from displayed fields instead of concatenating unrelated fields', async () => {
  const { searchCompoundSeries } = await import('../src/lib/compoundVerbs.ts')
  assert.deepEqual(searchCompoundSeries('折り返すおりかえす'), [])
  assert.deepEqual(searchCompoundSeries('取出；提取圧縮'), [])
  assert.ok(searchCompoundSeries('折り返す おりかえす').some(series => series.id === 'naosu-kaesu'))
})
