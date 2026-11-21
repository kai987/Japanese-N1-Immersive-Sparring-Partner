import catalog from 'virtual:n1-compound-catalog'
import { normalizeSearchText } from './searchHighlight.ts'

export interface CompoundCatalogEntry { id: string; title: string; words: string[] }
const wordIndex = new Map<string, { id: string; title: string }[]>()
for (const { id, title, words } of catalog) for (const key of words) {
  wordIndex.set(key, [...(wordIndex.get(key) ?? []), { id, title }])
}
export const getCompoundSeriesForWord = (word: string) => wordIndex.get(normalizeSearchText(word)) ?? []
export function compoundSeriesFromHash(hash: string) {
  const match = /^#compound-verbs(?:\/([^/]+))?$/.exec(hash)
  if (!match) return undefined
  try { return catalog.find(series => series.id === decodeURIComponent(match[1] ?? 'au'))?.id ?? 'au' }
  catch { return 'au' }
}
