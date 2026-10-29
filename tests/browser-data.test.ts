import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createBrowserAudio, createBrowserLessons, mergeBrowserReviews } from '../scripts/lib/browserData.ts'
import { validateContent } from '../scripts/validate-content.ts'
import { validateStudySnapshot, withItStudy, type StudySnapshot } from '../src/lib/itStudy.ts'
import { reviewFocusByDate as legacyReview } from '../src/data/history-legacy.ts'
import { clientAudioPlaybackUrl } from '../src/lib/audioClientTypes.ts'
import { audioPlaybackUrl } from '../src/lib/audioSources.ts'

test('browser lessons preserve every verified field, identity and review while the entry catalog contains only the latest lesson', () => {
  const result = createBrowserLessons(), original = validateContent()
  const snapshot = validateStudySnapshot(JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json', import.meta.url), 'utf8')) as StudySnapshot)
  for (const lesson of original.lessons) assert.deepEqual(result.byDate[lesson.date].lesson, withItStudy(lesson, snapshot))
  const reviews = { ...legacyReview, ...Object.fromEntries(original.generated.filter(entry => Array.isArray(entry.reviewFocus)).map(entry => [entry.lesson.date, entry.reviewFocus])) }
  for (const lesson of original.lessons) assert.deepEqual(result.byDate[lesson.date].reviewFocus, reviews[lesson.date] ?? [])
  assert.equal(result.catalog.latest.lesson.date, original.lessons[0].date)
  assert.equal(result.catalog.historyItems.length, original.lessons.length)
  assert.deepEqual(Object.keys(result.catalog).sort(), ['historyItems', 'latest'])
  for (const metadata of result.catalog.historyItems) assert.deepEqual(Object.keys(metadata).sort(), ['date', 'day', 'merged', 'minutes', 'title'])
})

test('an optional generated review preserves legacy review while an explicit empty review overrides it', () => {
  const lesson = validateContent().lessons[0]
  const legacy = { [lesson.date]: [{ type: '語彙' as const, title: '既存の復習', detail: '保持する内容' }] }
  assert.deepEqual(mergeBrowserReviews(legacy, [{ lesson }]), legacy)
  assert.deepEqual(mergeBrowserReviews(legacy, [{ lesson, reviewFocus: [] }]), { [lesson.date]: [] })
})

test('compact browser audio retains every existing playback URL/duration and leaves evidence outside the client index', () => {
  const index = createBrowserAudio()
  const sources = JSON.parse(readFileSync(new URL('../src/data/audio-sources.json', import.meta.url), 'utf8'))
  const pending = JSON.parse(readFileSync(new URL('../src/data/audio-pending.json', import.meta.url), 'utf8'))
  for (const [id, original] of Object.entries(sources.clips) as [string, { duration: number }][]) {
    assert.equal(index.clips[id].duration, original.duration)
    assert.equal(clientAudioPlaybackUrl(index, id), audioPlaybackUrl(id))
    assert.deepEqual(Object.keys(index.clips[id]).sort(), ['duration', 'path', 'provider'])
  }
  assert.equal(index.pendingClips, pending.pendingClips)
  for (const [unit, count] of Object.entries(index.pendingByLiveUnit)) {
    assert.equal(count, pending.entries.filter((entry: { references: string[] }) => entry.references.some(ref => ref.startsWith(`live/${unit}/`))).length)
  }
})
