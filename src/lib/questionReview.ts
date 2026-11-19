import type { PracticeCategory, ReadingAttempt, ReadingQuestion, StoredProgress } from '../types.ts'
import { isDate, tokyoDate } from './progress.ts'

export type { PracticeCategory } from '../types.ts'

export interface QuestionReviewState {
  questionId: string
  /** Dated, distinct correct submissions since the most recent wrong answer. */
  streak: number
  lastWrong: string | null
  lastAttempt: string | null
  dueDate: string | null
  due: boolean
  intervalDays: 1 | 3 | 7 | 14
  reducedFrequency: boolean
}

const validAnswer = (answer: unknown): answer is number => Number.isInteger(answer) && Number(answer) >= 0 && Number(answer) < 4
const validAttempt = (value: ReadingAttempt) => value && validAnswer(value.answer) &&
  (value.at === null || (typeof value.at === 'string' && Number.isFinite(Date.parse(value.at))))
const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10)

/** Derive a review queue from submitted answers. Never rewrite saved history. */
export function questionReview(
  question: Pick<ReadingQuestion, 'id' | 'answer'>,
  progress: Pick<StoredProgress, 'readingAnswers' | 'readingAttempts'>,
  todayJst = tokyoDate(),
): QuestionReviewState | null {
  if (!isDate(todayJst)) throw new RangeError('A valid JST review date is required')
  // Unknown legacy dates remain unknown. Sorting a copy also handles imports
  // whose dated entries were not chronological, without mutating the record.
  const attempts = (progress.readingAttempts?.[question.id] ?? []).filter(validAttempt)
    .slice().sort((a, b) => {
      if (a.at === null) return b.at === null ? 0 : -1
      if (b.at === null) return 1
      return Date.parse(a.at) - Date.parse(b.at)
    })
  const saved = progress.readingAnswers?.[question.id]
  // A legacy answer is evidence of a submission, but never evidence of its
  // date. A conflicting current answer is kept conservatively as undated.
  if (validAnswer(saved) && attempts.at(-1)?.answer !== saved) attempts.push({ answer: saved, at: null })
  let wrongIndex = -1
  for (let index = attempts.length - 1; index >= 0; index--) {
    if (attempts[index].answer !== question.answer) { wrongIndex = index; break }
  }
  if (wrongIndex < 0) return null

  const lastWrong = attempts[wrongIndex].at
  const subsequent = attempts.slice(wrongIndex + 1)
  // Replayed identical rows and undated legacy rows cannot manufacture two
  // successful reviews. The original rows are still retained in storage.
  const streak = new Set(subsequent.filter(attempt => attempt.answer === question.answer && attempt.at !== null)
    .map(attempt => Date.parse(attempt.at!))).size
  const reducedFrequency = streak >= 2
  const intervalDays = streak < 2 ? 1 : streak === 2 ? 3 : streak === 3 ? 7 : 14
  const lastAttempt = attempts.at(-1)!.at
  const dueDate = lastAttempt === null ? null : addDays(tokyoDate(new Date(lastAttempt)), intervalDays)
  return { questionId: question.id, streak, lastWrong, lastAttempt, dueDate,
    due: dueDate === null || dueDate <= todayJst, intervalDays, reducedFrequency }
}

const categories: readonly PracticeCategory[] = ['vocabulary', 'grammar', 'reading']
const validCategory = (category: string): category is PracticeCategory => categories.includes(category as PracticeCategory)
const validId = (id: string) => id.length > 0 && !/[\u0000-\u0020\u007f]/u.test(id)

/** Stable across sorting, filtering, and changing the displayed question number. */
export const questionElementId = (id: string) => `practice-question-${encodeURIComponent(id)}`

export function practiceHref(date: string, category: PracticeCategory, id: string) {
  if (!isDate(date) || !validCategory(category) || !validId(id)) throw new RangeError('Invalid practice question destination')
  return `#practice/${date}/${category}/${encodeURIComponent(id)}`
}

export function parsePracticeHash(hash: string): { date: string; category: PracticeCategory; id: string } | null {
  const match = /^#practice\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(hash)
  if (!match) return null
  try {
    const date = decodeURIComponent(match[1]), category = decodeURIComponent(match[2]), id = decodeURIComponent(match[3])
    if (!isDate(date) || !validCategory(category) || !validId(id)) return null
    // The caller resolves this ID against the loaded lesson before navigation.
    return { date, category, id }
  } catch { return null }
}
