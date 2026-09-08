import type { DailyLesson } from '../types'
import {
  historyItems as legacyHistoryItems,
  lesson as legacyLatestLesson,
  lessons as legacyLessons,
  reviewFocusByDate as legacyReviewFocusByDate,
} from './history-legacy'

type ReviewFocus = { type: '词汇' | '文法' | '读解'; title: string; detail: string }
type HistoryItem = { date: string; day: number; title: string; minutes: number; merged: boolean }
type DailyArchiveFile = {
  lesson: DailyLesson
  reviewFocus?: ReviewFocus[]
  merged?: boolean
}

// Any YYYY-MM-DD.json added under ./daily is picked up automatically by Vite.
// Generated entries override a legacy entry with the same date, so the daily
// automation only needs to create/update one JSON file per day.
const generatedModules = import.meta.glob('./daily/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, DailyArchiveFile>

const generatedEntries = Object.values(generatedModules).filter(
  (entry): entry is DailyArchiveFile => Boolean(entry?.lesson?.date),
)

const generatedByDate = new Map(generatedEntries.map((entry) => [entry.lesson.date, entry]))
const lessonByDate = new Map<string, DailyLesson>()

legacyLessons.forEach((item) => lessonByDate.set(item.date, item))
generatedEntries.forEach((entry) => lessonByDate.set(entry.lesson.date, entry.lesson))

export const lessons: DailyLesson[] = [...lessonByDate.values()].sort((a, b) => b.date.localeCompare(a.date))
export const lesson: DailyLesson = lessons[0] ?? legacyLatestLesson
export const getLessonByDate = (date: string) => lessonByDate.get(date) ?? lesson

const legacyHistoryByDate = new Map(legacyHistoryItems.map((item) => [item.date, item]))

export const historyItems: HistoryItem[] = lessons.map((item) => {
  const generated = generatedByDate.get(item.date)
  const legacy = legacyHistoryByDate.get(item.date)
  return {
    date: item.date,
    day: item.day,
    title: item.title,
    minutes: item.estimatedMinutes,
    merged: generated?.merged ?? legacy?.merged ?? false,
  }
})

const generatedReview = Object.fromEntries(
  generatedEntries
    .filter((entry) => Array.isArray(entry.reviewFocus))
    .map((entry) => [entry.lesson.date, entry.reviewFocus ?? []]),
) as Record<string, ReviewFocus[]>

export const reviewFocusByDate: Record<string, ReviewFocus[]> = {
  ...legacyReviewFocusByDate,
  ...generatedReview,
}
