import type { DailyLesson } from '../types'
import {
  historyItems as legacyHistoryItems,
  lesson as legacyLatestLesson,
  lessons as legacyLessons,
  reviewFocusByDate as legacyReviewFocusByDate,
} from './history-legacy'

import { mergeArchives, type ReviewFocus } from '../lib/archive'
type HistoryItem = { date: string; day: number; title: string; minutes: number; merged: boolean }

const modules = import.meta.glob('./daily/*.json', { eager: true, import: 'default' })
const catalog = mergeArchives(legacyLessons, modules)
const generatedEntries = catalog.generated
const generatedByDate = new Map(generatedEntries.map((entry) => [entry.lesson.date, entry]))
const lessonByDate = catalog.byDate
export const lessons: DailyLesson[] = catalog.lessons
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
