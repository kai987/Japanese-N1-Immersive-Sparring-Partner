import type { LiveReactionGroup } from '../data/live-reactions.ts'
import type { LiveUnitGroup } from '../data/live-reaction-units.ts'
import { getSearchTerms, normalizeSearchText } from './searchHighlight.ts'

export type LiveStatus = 'new' | 'review' | 'mastered'
export interface LiveProgress { version: 1; groups: Record<string, LiveStatus> }
export const liveProgressKey = 'n1-live-reactions-progress-v1'
export const initialLiveProgress: LiveProgress = { version: 1, groups: {} }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function decodeLiveProgress(input: unknown): { value: LiveProgress; recovered: boolean } {
  if (!isRecord(input) || input.version !== 1 || !isRecord(input.groups)) {
    return { value: initialLiveProgress, recovered: true }
  }
  const valid = Object.entries(input.groups).filter(([, status]) => status === 'new' || status === 'review' || status === 'mastered')
  return {
    value: { version: 1, groups: Object.fromEntries(valid) as Record<string, LiveStatus> },
    recovered: valid.length !== Object.keys(input.groups).length,
  }
}

export function liveGroupSearchFields(group: LiveReactionGroup & Partial<Pick<LiveUnitGroup, 'source'>>): string[] {
  return [group.title, group.subtitle, ...group.points,
    ...group.entries.flatMap(item => [item.expression, item.reading, item.meaning, item.note ?? '']),
    ...group.examples.flatMap(item => [item.japanese, item.chinese]),
    ...(group.source ? [group.source.quote, group.source.translation] : [])]
}
export function matchesLiveGroup(group: LiveReactionGroup, query: string): boolean {
  const fields = liveGroupSearchFields(group).map(normalizeSearchText)
  return getSearchTerms(query).every(word => fields.some(text => text.includes(word)))
}
