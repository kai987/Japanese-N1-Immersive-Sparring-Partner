import { compoundVerbSeries } from '../data/compound-verbs.ts'
import { getSearchTerms, normalizeSearchText } from './searchHighlight.ts'
export { compoundVerbSeries } from '../data/compound-verbs.ts'

// An editorial index, rather than a suffix guess: similar spellings need not
// share a construction (相殺する, for example, is not a V+V compound).
const normalize = normalizeSearchText
const wordIndex = new Map<string, typeof compoundVerbSeries>()
for (const series of compoundVerbSeries) {
  const keys = new Set([...series.triggers, ...series.groups.flatMap(group => group.words.map(entry => entry.word))].map(normalize))
  for (const key of keys) wordIndex.set(key, [...(wordIndex.get(key) ?? []), series])
}
export const getCompoundSeriesForWord = (word: string) => wordIndex.get(normalize(word)) ?? []
export const getCompoundSeriesById = (id: string) => compoundVerbSeries.find(series => series.id === id)
const searchIndex = compoundVerbSeries.map(series => ({ series, fields: [
  series.title, series.subtitle, series.summary, series.structure, ...series.notes, ...series.triggers,
  ...series.groups.flatMap(group => [group.title, group.description, ...group.words.flatMap(entry => [entry.word, entry.reading, entry.meaning, entry.example, entry.translation, entry.note ?? ''])]),
].map(normalize) }))
export function searchCompoundSeries(query: string) {
  const terms = getSearchTerms(query)
  return searchIndex.filter(({ fields }) => terms.every(term => fields.some(text => text.includes(term)))).map(({ series }) => series)
}
export function compoundSeriesFromHash(hash: string) {
  const match = /^#compound-verbs(?:\/([^/]+))?$/.exec(hash)
  if (!match) return undefined
  try { return getCompoundSeriesById(decodeURIComponent(match[1] ?? 'au'))?.id ?? 'au' }
  catch { return 'au' }
}
