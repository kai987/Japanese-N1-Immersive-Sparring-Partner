import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { BrowserLesson, BrowserCatalog } from '../../src/lib/lessonDataTypes.ts'
import { validateContent } from '../validate-content.ts'
import { withItStudy, type StudySnapshot } from '../../src/lib/itStudy.ts'
import { historyItems as legacyHistory, reviewFocusByDate as legacyReview } from '../../src/data/history-legacy.ts'
import type { DailyArchiveFile, ReviewFocus } from '../../src/lib/archive.ts'

const root = new URL('../../', import.meta.url)
const read = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'))

export function mergeBrowserReviews(legacy: Record<string, ReviewFocus[]>, generated: DailyArchiveFile[]) {
  return { ...legacy, ...Object.fromEntries(generated.filter(entry => Array.isArray(entry.reviewFocus))
    .map(entry => [entry.lesson.date, entry.reviewFocus!])) }
}

/** Full source/evidence checks run in Node; browsers receive the verified view. */
export function createBrowserLessons() {
  const catalog = validateContent()
  const snapshot = read('src/data/it-study-snapshot.json') as StudySnapshot
  const lessons = catalog.lessons.map(lesson => withItStudy(lesson, snapshot))
  const generated = new Map(catalog.generated.map(entry => [entry.lesson.date, entry]))
  const legacy = new Map(legacyHistory.map(entry => [entry.date, entry]))
  const reviewFocusByDate = mergeBrowserReviews(legacyReview, catalog.generated)
  const byDate = Object.fromEntries(lessons.map(lesson => [lesson.date, { lesson, reviewFocus: reviewFocusByDate[lesson.date] ?? [] }])) as Record<string, BrowserLesson>
  if (!lessons.length) throw new Error('No verified learning content is available')
  const browserCatalog: BrowserCatalog = {
    latest: byDate[lessons[0].date],
    historyItems: lessons.map(lesson => ({ date: lesson.date, day: lesson.day, title: lesson.title, minutes: lesson.estimatedMinutes,
      merged: generated.get(lesson.date)?.merged ?? legacy.get(lesson.date)?.merged ?? false })),
  }
  return { catalog: browserCatalog, byDate, lessons, reviewFocusByDate }
}

/** Keep byte hashes/provenance server-side; immutable playback paths stay exact. */
export function createBrowserAudio() {
  const sources = read('src/data/audio-sources.json')
  const index = read('src/data/audio-index.json')
  const pending = read('src/data/audio-pending.json')
  const clips: Record<string, { provider: 'daily' | 'supabase' | 'local'; path: string; duration: number }> = {}
  for (const [id, duration] of Object.entries(index.clips)) {
    const recording = sources.complete ? sources.clips[id] : undefined
    clips[id] = recording ? { provider: recording.provider, path: recording.path, duration: recording.duration }
      : { provider: 'local', path: `audio/morioki-normal/${id}.mp3`, duration: Number(duration) }
  }
  const pendingSets = new Map<string, Set<string>>()
  for (const entry of pending.entries) for (const reference of entry.references) {
    if (!reference.startsWith('live/')) continue
    const unit = reference.split('/')[1]
    if (!pendingSets.has(unit)) pendingSets.set(unit, new Set())
    pendingSets.get(unit)!.add(entry.id)
  }
  return { version: 1 as const, complete: sources.complete, verifiedAt: sources.verifiedAt,
    providers: sources.providers, clips, pendingClips: pending.pendingClips,
    pendingByLiveUnit: Object.fromEntries([...pendingSets].map(([id, entries]) => [id, entries.size])) }
}

export const browserDataRoot = fileURLToPath(root)
