import { decodeCompleted, decodeProgress, decodeTheme, initialProgress, isRecord } from './progress.ts'
import { decodeLiveProgress, initialLiveProgress, liveProgressKey, type LiveProgress } from './liveReactions.ts'
import { mergeAttemptHistory } from './storageMerge.ts'
import { sharedStorage } from './sharedStorage.ts'
import type { StoredProgress } from '../types.ts'

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024
export interface LearningRecords {
  'n1-progress': StoredProgress
  'n1-completed-lessons': Record<string, boolean>
  'n1-theme': 'light' | 'dark'
  'n1-live-reactions-progress-v1': LiveProgress
}
export interface ProgressBackup { application: 'japanese-n1-learning-records'; version: 1; exportedAt: string; records: LearningRecords }
export const learningRecordKeys = ['n1-progress', 'n1-completed-lessons', 'n1-theme', liveProgressKey] as const
const decoders = {
  'n1-progress': decodeProgress, 'n1-completed-lessons': decodeCompleted,
  'n1-theme': decodeTheme, 'n1-live-reactions-progress-v1': decodeLiveProgress,
}

export function validateLearningRecords(input: unknown): LearningRecords {
  if (!isRecord(input) || Object.keys(input).length !== learningRecordKeys.length
    || Object.keys(input).some(key => !learningRecordKeys.includes(key as typeof learningRecordKeys[number]))) throw new Error('学習記録の項目が正しくありません。')
  const result: Record<string, unknown> = {}
  for (const key of learningRecordKeys) {
    const decoded = decoders[key](input[key])
    if (decoded.recovered) throw new Error('破損した学習記録が含まれています。元のファイルを確認してください。')
    result[key] = decoded.value
  }
  return result as unknown as LearningRecords
}
export function createProgressBackup(records: LearningRecords, now = new Date()): ProgressBackup {
  return { application: 'japanese-n1-learning-records', version: 1, exportedAt: now.toISOString(), records: validateLearningRecords(records) }
}
export function parseProgressBackup(text: string): ProgressBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error('2 MB以下の学習記録ファイルを選んでください。')
  let input: unknown
  try { input = JSON.parse(text) } catch { throw new Error('JSONファイルを読み込めませんでした。') }
  if (!isRecord(input) || input.application !== 'japanese-n1-learning-records' || input.version !== 1
    || typeof input.exportedAt !== 'string' || !Number.isFinite(Date.parse(input.exportedAt))) throw new Error('対応していない学習記録ファイルです。')
  return { application: input.application, version: 1, exportedAt: input.exportedAt, records: validateLearningRecords(input.records) }
}

/** Import adds missing records. Existing deliberate marks/answers take priority. */
export function mergeLearningRecords(current: LearningRecords, incoming: LearningRecords): LearningRecords {
  const left = validateLearningRecords(current), right = validateLearningRecords(incoming)
  const progress = left['n1-progress'], imported = right['n1-progress']
  const attempts = Object.fromEntries([...new Set([...Object.keys(imported.readingAttempts), ...Object.keys(progress.readingAttempts)])]
    .map(id => [id, mergeAttemptHistory(progress.readingAttempts[id] ?? [], imported.readingAttempts[id] ?? [])]))
  return {
    'n1-progress': { version: 2, vocab: { ...imported.vocab, ...progress.vocab }, grammar: { ...imported.grammar, ...progress.grammar },
      readingAnswers: { ...imported.readingAnswers, ...progress.readingAnswers }, readingAttempts: attempts,
      studyDates: [...new Set([...progress.studyDates, ...imported.studyDates])].sort() },
    'n1-completed-lessons': { ...right['n1-completed-lessons'], ...left['n1-completed-lessons'] },
    'n1-theme': left['n1-theme'],
    'n1-live-reactions-progress-v1': { version: 1, groups: { ...right['n1-live-reactions-progress-v1'].groups, ...left['n1-live-reactions-progress-v1'].groups } },
  }
}
export function backupSummary(records: LearningRecords) {
  return { vocabulary: Object.keys(records['n1-progress'].vocab).length, grammar: Object.keys(records['n1-progress'].grammar).length,
    answers: Object.keys(records['n1-progress'].readingAnswers).length,
    attempts: Object.values(records['n1-progress'].readingAttempts).reduce((sum, items) => sum + items.length, 0),
    completed: Object.values(records['n1-completed-lessons']).filter(Boolean).length,
    live: Object.keys(records['n1-live-reactions-progress-v1'].groups).length }
}
function browserStores() {
  return {
    'n1-progress': sharedStorage('n1-progress', initialProgress, decodeProgress),
    'n1-completed-lessons': sharedStorage('n1-completed-lessons', {} as Record<string, boolean>, decodeCompleted),
    'n1-theme': sharedStorage('n1-theme', 'light' as const as 'light' | 'dark', decodeTheme),
    'n1-live-reactions-progress-v1': sharedStorage(liveProgressKey, initialLiveProgress, decodeLiveProgress),
  }
}
export function readBrowserLearningRecords(): LearningRecords {
  const stores = browserStores(), records: Record<string, unknown> = {}
  for (const key of learningRecordKeys) { stores[key].refresh(false); records[key] = stores[key].getSnapshot().value }
  return validateLearningRecords(records)
}
export function importBrowserLearningRecords(backup: ProgressBackup): LearningRecords {
  const stores = browserStores(), merged = mergeLearningRecords(readBrowserLearningRecords(), backup.records)
  stores['n1-progress'].update(previous => mergeLearningRecords({ ...merged, 'n1-progress': previous }, backup.records)['n1-progress'])
  stores['n1-completed-lessons'].update(previous => ({ ...backup.records['n1-completed-lessons'], ...previous }))
  stores['n1-live-reactions-progress-v1'].update(previous => ({ version: 1, groups: { ...backup.records['n1-live-reactions-progress-v1'].groups, ...previous.groups } }))
  if (Object.values(stores).some(store => store.getSnapshot().failed)) throw new Error('一部の記録を保存できませんでした。現在の記録は保持しています。保存を再試行してから、もう一度取り込んでください。')
  return readBrowserLearningRecords()
}
