import assert from 'node:assert/strict'
import test from 'node:test'
import { audioId, audioRelativePath, audioVoice, normalizeAudioText, splitAudioSentences } from '../src/lib/audioText.ts'

test('speech identity is stable after text normalization and never depends on card order', () => {
  assert.equal(audioVoice.styleId, 497929760)
  assert.equal(audioVoice.name, 'morioki')
  assert.equal(audioVoice.style, 'ノーマル')
  assert.equal(audioId(' ＡＰＩ '), audioId('API'))
  assert.equal(audioId('～合う'), audioId('合う'))
  assert.notEqual(audioId('間に合う'), audioId('まにあう'))
  const texts = ['そうさいする', 'まにあう', '締切に間に合う', 'ｶﾞｲﾄﾞ', '😀確認する']
  const ids = texts.map(audioId)
  assert.equal(new Set(ids).size, texts.length)
  assert.deepEqual([...texts].reverse().map(audioId), [...ids].reverse())
  assert.match(audioRelativePath(ids[0]), /^audio\/morioki-normal\/[0-9a-f]{16}\.mp3$/)
})

test('sentence controls cover every Japanese sentence without dropping punctuation or quoted endings', () => {
  const text = '最初の確認に間に合いませんでした。次の取得を待ちます！「大丈夫？」と聞きました。'
  const sentences = splitAudioSentences(text)
  assert.ok(sentences.length >= 3)
  assert.equal(sentences.join(''), text)
  assert.deepEqual(splitAudioSentences('  話し合う  '), ['話し合う'])
  assert.equal(normalizeAudioText('> **～にせよ／～にしろ**'), 'にせよ、にしろ')
  assert.deepEqual(splitAudioSentences(''), [])
})
