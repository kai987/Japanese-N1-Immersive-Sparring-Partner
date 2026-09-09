import type { LearningStatus, StoredProgress, ReadingAttempt } from '../types.ts'

export const initialProgress: StoredProgress = {
  version: 2, vocab: {}, grammar: {}, readingAnswers: {}, readingAttempts: {}, studyDates: [],
}
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
export const isDate = (value: unknown): value is string => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
export const tokyoDate = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now)
const previousDate = (date: string) => new Date(Date.parse(date) - 86400000).toISOString().slice(0, 10)
export function streakFor(dates: string[], today = tokyoDate()) {
  const studied = new Set(dates)
  let cursor = studied.has(today) ? today : previousDate(today)
  let count = 0
  while (studied.has(cursor)) { count++; cursor = previousDate(cursor) }
  return count
}
export const recordStudy = (progress: StoredProgress, date = tokyoDate()): StoredProgress => ({
  ...progress, studyDates: [...new Set([...progress.studyDates, date])].sort(),
})
export type Decoded<T> = { value: T; recovered: boolean }
const status = (value: unknown): value is LearningStatus => typeof value === 'string' && ['new', 'review', 'mastered'].includes(value)
const answer = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) < 4
const attempt = (value: unknown): value is ReadingAttempt => isRecord(value) && answer(value.answer) &&
  (value.at === null || (typeof value.at === 'string' && Number.isFinite(Date.parse(value.at))))

// Keep valid entries when one part of an older or damaged record needs repair.
export function decodeProgress(input: unknown): Decoded<StoredProgress> {
  const source = isRecord(input) ? input : {}
  let recovered = !isRecord(input) || (source.version !== undefined && source.version !== 2)
  function map<T>(key: string, valid: (v: unknown) => v is T, optional = false): Record<string, T> {
    const raw = source[key]
    if (raw === undefined && optional) return {}
    if (!isRecord(raw)) { recovered = true; return {} }
    return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, T] => {
      const v = entry[1]
      if (valid(v)) return true
      recovered = true; return false
    }))
  }
  const vocab = map('vocab', status)
  const grammar = map('grammar', status)
  const readingAnswers = map('readingAnswers', answer)
  const readingAttempts = map('readingAttempts', (v): v is ReadingAttempt[] => Array.isArray(v) && v.every(attempt), true)
  // Legacy answers use canonical option indexes. Preserve them and do not invent dates.
  for (const [id, saved] of Object.entries(readingAnswers)) {
    if (!readingAttempts[id]?.length) readingAttempts[id] = [{ answer: saved, at: null }]
  }
  const rawDates = source.studyDates
  const studyDates = Array.isArray(rawDates) ? rawDates.filter(isDate) : []
  if ((rawDates !== undefined && !Array.isArray(rawDates)) ||
      (Array.isArray(rawDates) && studyDates.length !== rawDates.length)) recovered = true
  return { value: { version: 2, vocab, grammar, readingAnswers, readingAttempts,
    studyDates: [...new Set(studyDates)].sort() }, recovered }
}
export function decodeCompleted(input: unknown): Decoded<Record<string, boolean>> {
  if (!isRecord(input)) return { value: {}, recovered: true }
  const entries = Object.entries(input).filter(([key, value]) => isDate(key) && typeof value === 'boolean')
  return { value: Object.fromEntries(entries) as Record<string, boolean>, recovered: entries.length !== Object.keys(input).length }
}
export function decodeTheme(input: unknown): Decoded<'light' | 'dark'> {
  return input === 'light' || input === 'dark'
    ? { value: input, recovered: false } : { value: 'light', recovered: true }
}
