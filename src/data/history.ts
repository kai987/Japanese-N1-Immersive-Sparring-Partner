import catalog from 'virtual:n1-catalog'
import assets from 'virtual:n1-data-assets'
import type { BrowserLesson } from '../lib/lessonDataTypes.ts'

export const historyItems = catalog.historyItems
export const lesson = catalog.latest.lesson
const cache = new Map<string, BrowserLesson>([[lesson.date, catalog.latest]])
const pending = new Map<string, Promise<BrowserLesson>>()
export const getCachedLesson = (date: string) => cache.get(date)
export function loadLesson(date: string): Promise<BrowserLesson> {
  const cached = cache.get(date)
  if (cached) return Promise.resolve(cached)
  if (!assets.lessons[date]) return Promise.resolve(catalog.latest)
  let request = pending.get(date)
  if (!request) {
    request = fetch(assets.lessons[date], { cache: 'no-cache' }).then(response => {
      if (!response.ok) throw new Error(`Lesson data request failed (${response.status})`)
      return response.json() as Promise<BrowserLesson>
    }).then(value => {
      if (value?.lesson?.date !== date || !Array.isArray(value.reviewFocus)) throw new Error('Unexpected lesson data')
      cache.set(date, value); return value
    }).finally(() => { pending.delete(date) })
    pending.set(date, request)
  }
  return request
}
