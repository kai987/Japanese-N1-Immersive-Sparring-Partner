export interface SearchRange { start: number; end: number }

const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' })
export const normalizeSearchText = (text: string) => text.normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/[\s~～〜]/gu, '')
export const getSearchTerms = (query: string) => [...new Set(query.trim().split(/\s+/u).map(normalizeSearchText).filter(Boolean))]

// Keep original UTF-16 offsets after normalization: ｶﾞ -> ガ and an emoji
// must still highlight whole graphemes in the unmodified learning text.
export function getSearchRanges(text: string, query: string): SearchRange[] {
  const terms = getSearchTerms(query)
  if (!terms.length) return []
  let normalized = ''
  const offsets: SearchRange[] = []
  for (const { segment, index } of segmenter.segment(text)) {
    const value = normalizeSearchText(segment)
    normalized += value
    for (let indexInValue = 0; indexInValue < value.length; indexInValue++) {
      offsets.push({ start: index, end: index + segment.length })
    }
  }
  const ranges: SearchRange[] = []
  for (const term of terms) {
    let position = normalized.indexOf(term)
    while (position !== -1) {
      ranges.push({ start: offsets[position].start, end: offsets[position + term.length - 1].end })
      position = normalized.indexOf(term, position + 1)
    }
  }
  const merged: SearchRange[] = []
  for (const range of ranges.sort((a, b) => a.start - b.start || a.end - b.end)) {
    const previous = merged.at(-1)
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  return merged
}
