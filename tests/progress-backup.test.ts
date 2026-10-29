import test from 'node:test'
import assert from 'node:assert/strict'
import { backupSummary, createProgressBackup, MAX_BACKUP_BYTES, mergeLearningRecords, parseProgressBackup, type LearningRecords } from '../src/lib/progressBackup.ts'
import { decodeProgress, initialProgress } from '../src/lib/progress.ts'

const records = (): LearningRecords => ({ 'n1-progress': structuredClone(initialProgress), 'n1-completed-lessons': {},
  'n1-theme': 'dark', 'n1-live-reactions-progress-v1': { version: 1, groups: {} } })

test('backup roundtrip preserves unknown valid identities, canonical answers and repeated legacy history', () => {
  const value = records()
  value['n1-progress'] = decodeProgress({ vocab: { 'old-unlisted-card': 'mastered' }, grammar: {}, readingAnswers: { 'legacy-question': 2 } }).value
  value['n1-progress'].readingAttempts['legacy-question'].push({ answer: 2, at: null })
  value['n1-progress'].studyDates = ['2026-09-28', '2026-10-29']
  value['n1-live-reactions-progress-v1'].groups['unlisted-group'] = 'review'
  value['n1-completed-lessons']['2026-09-28'] = true
  const exported = createProgressBackup(value, new Date('2026-10-30T02:10:00Z'))
  assert.deepEqual(parseProgressBackup(JSON.stringify(exported)), exported)
  assert.deepEqual(backupSummary(exported.records), { vocabulary: 1, grammar: 0, answers: 1, attempts: 2, completed: 1, live: 1 })
})

test('import keeps current deliberate marks and answers, adding missing records and history idempotently', () => {
  const current = records(), incoming = records()
  current['n1-progress'].vocab = { a: 'new' }
  incoming['n1-progress'].vocab = { a: 'mastered', b: 'review' }
  current['n1-progress'].readingAnswers.q = 2; incoming['n1-progress'].readingAnswers.q = 0
  current['n1-progress'].readingAttempts.q = [{ answer: 2, at: '2026-10-30T02:00:00Z' }]
  incoming['n1-progress'].readingAttempts.q = [{ answer: 0, at: null }]
  current['n1-progress'].studyDates = ['2026-10-30']; incoming['n1-progress'].studyDates = ['2026-10-29']
  current['n1-completed-lessons']['2026-10-29'] = false; incoming['n1-completed-lessons']['2026-10-29'] = true
  current['n1-live-reactions-progress-v1'].groups.a = 'new'; incoming['n1-live-reactions-progress-v1'].groups = { a: 'mastered', b: 'review' }
  incoming['n1-theme'] = 'light'
  const merged = mergeLearningRecords(current, incoming)
  assert.deepEqual(merged['n1-progress'].vocab, { a: 'new', b: 'review' })
  assert.equal(merged['n1-progress'].readingAnswers.q, 2)
  assert.equal(merged['n1-progress'].readingAttempts.q.length, 2)
  assert.deepEqual(merged['n1-progress'].studyDates, ['2026-10-29', '2026-10-30'])
  assert.equal(merged['n1-completed-lessons']['2026-10-29'], false)
  assert.deepEqual(merged['n1-live-reactions-progress-v1'].groups, { a: 'new', b: 'review' })
  assert.equal(merged['n1-theme'], 'dark')
  assert.deepEqual(mergeLearningRecords(merged, incoming), merged)
})

test('foreign, malformed, oversized and partially invalid backups are rejected before any import', () => {
  const good = createProgressBackup(records())
  for (const input of ['{broken', JSON.stringify({ ...good, version: 9 }), JSON.stringify({ ...good, application: 'other' }),
    JSON.stringify({ ...good, records: { ...good.records, 'private-token': 'must-not-import' } }),
    JSON.stringify({ ...good, records: { ...good.records, 'n1-progress': { ...initialProgress, vocab: { bad: 'oops' } } } }),
    JSON.stringify({ ...good, records: { ...good.records, 'n1-completed-lessons': { 'not-a-date': true } } }),
    ' '.repeat(MAX_BACKUP_BYTES + 1)]) assert.throws(() => parseProgressBackup(input))
  assert.deepEqual(records(), records(), 'validation has no persistence side effects')
})
