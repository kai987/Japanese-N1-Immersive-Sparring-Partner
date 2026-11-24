import type { LiveUnit, LiveUnitGroup } from '../data/live-reaction-units.ts'

type SourcePresentationGroup = Pick<LiveUnitGroup, 'id' | 'source' | 'entries' | 'examples'>

// Compatibility only: 25 independent quotations approved in the original
// September 30 audit. Keep the frozen legacy teaching payload/audio references
// unchanged. Never add new dates or IDs here; use source.contextReason instead.
const legacyIndependentContextIds = new Set([
  'whole', 'hatashite', 'meguriau', 'zuibun', 'atarimae', 'datte',
  'tsukuzuku', 'wish', 'monka', 'nido', 'sae', 'teoku', 'hodai', 'kau',
  'counter', 'shikatanai', 'kasou', 'tayasu', 'imani', 'guttari',
  'ikifukikaesu', 'almost', 'increase', 'grow', 'nanka',
].map(name => `live-2026-09-30-${name}`))

// Compare whole expressions, not substrings: punctuation, line wrapping and
// full-width variants must not make a list of existing terms look like new
// context. Kana readings also catch an otherwise identical kana-only quote.
const normalizeQuotation = (text: string) => text.normalize('NFKC')
  .replace(/[\p{P}\p{Z}\s~〜～]/gu, '')

/** True if the entire quote consists of already displayed entries/examples. */
export function isRepeatedLiveSource(group: SourcePresentationGroup): boolean {
  if (!group.source) return false
  const quote = normalizeQuotation(group.source.quote)
  if (!quote) return true
  const tokens = [...new Set([
    ...group.entries.flatMap(entry => [entry.expression, entry.reading]),
    ...group.examples.map(example => example.japanese),
  ].map(normalizeQuotation).filter(Boolean))]
  // Exact segmentation; a short word inside a genuinely longer sentence does
  // not itself make the whole sentence redundant. Repeated terms, alternate
  // whitespace, and lists spanning multiple entries are covered.
  const reachable = new Set<number>([0])
  for (let offset = 0; offset < quote.length; offset++) {
    if (!reachable.has(offset)) continue
    for (const token of tokens) {
      if (quote.startsWith(token, offset)) reachable.add(offset + token.length)
    }
  }
  return reachable.has(quote.length)
}

/**
 * Archive raw sources by default for EVERY new unit. Show an independent quote
 * only when explicitly justified, or when preserving approved legacy context.
 * Rendering and search must share this rule. Never mutate archived provenance,
 * the study cards, or published audio references.
 */
export function getVisibleLiveSource(group: SourcePresentationGroup): LiveUnitGroup['source'] {
  const source = group.source
  if (!source || (!legacyIndependentContextIds.has(group.id) && !source.contextReason?.trim())) return undefined
  return isRepeatedLiveSource(group) ? undefined : source
}

/** Reject an invalid opt-in at import/build instead of publishing a duplicate. */
export function validateLiveSourcePresentation(units: readonly Pick<LiveUnit, 'groups'>[]): void {
  for (const unit of units) for (const group of unit.groups) {
    const source = group.source
    if (source?.contextReason === undefined) continue
    if (typeof source.contextReason !== 'string' || !source.contextReason.trim()) {
      throw new Error(`Live source context requires a non-empty reason: ${group.id}`)
    }
    if (isRepeatedLiveSource(group)) {
      throw new Error(`Repeated live source cannot be displayed as independent context: ${group.id}`)
    }
  }
}
