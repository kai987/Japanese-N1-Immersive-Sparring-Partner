export const audioVoice = {
  engine: 'AivisSpeech', name: 'morioki', style: 'ノーマル',
  styleId: 497929760, speakerUuid: '396a746d-742f-4e43-b722-1182a7fab9af',
  speed: 1, sampleRate: 24000, codec: 'mp3-64k',
} as const

const sentenceSegmenter = new Intl.Segmenter('ja', { granularity: 'sentence' })
export const splitAudioSentences = (text: string) => Array.from(sentenceSegmenter.segment(text), part => part.segment.trim()).filter(Boolean)
export const hasJapaneseText = (text: string) => /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)
export const normalizeAudioText = (text: string) => text.normalize('NFKC')
  .replace(/^[>\s]+/gmu, '').replace(/[`*]/gu, '').replace(/[~〜]/gu, '')
  .replace(/[／/]/gu, '、').replace(/\s+/gu, ' ').trim()

const idCache = new Map<string, string>()
// Two independent 32-bit hashes give deterministic filenames in Node and the
// browser. The catalog builder also rejects any collision before synthesis.
export function audioId(text: string): string {
  const normalized = normalizeAudioText(text)
  const cached = idCache.get(normalized)
  if (cached) return cached
  const input = `${audioVoice.styleId}|${audioVoice.speed}|${audioVoice.sampleRate}|${audioVoice.codec}|${normalized}`
  let first = 0x811c9dc5, second = 0x9e3779b9
  for (let i = 0; i < input.length; i++) {
    first = Math.imul(first ^ input.charCodeAt(i), 0x01000193)
    second = Math.imul(second ^ input.charCodeAt(i), 0x85ebca6b)
  }
  const id = `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`
  idCache.set(normalized, id)
  return id
}
export const audioRelativePath = (id: string) => `audio/morioki-normal/${id}.mp3`
