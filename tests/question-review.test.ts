import test from 'node:test'
import assert from 'node:assert/strict'
import { questionReview, questionElementId, practiceHref, parsePracticeHash } from '../src/lib/questionReview.ts'
import { decodeProgress, initialProgress } from '../src/lib/progress.ts'
import type { ReadingAttempt, ReadingQuestion, StoredProgress } from '../src/types.ts'

const question: ReadingQuestion = {
  id: '2026-11-19-grammar-condition', prompt: '正しいものを選んでください。',
  options: ['一', '二', '三', '四'], answer: 1, explanation: '解説', optionNotes: ['一', '二', '三', '四'],
}
const record = (attempts: ReadingAttempt[], saved = attempts.at(-1)?.answer): StoredProgress => ({
  ...structuredClone(initialProgress),
  readingAnswers: saved === undefined ? {} : { [question.id]: saved },
  readingAttempts: { [question.id]: attempts },
})
const wrong = (at: string | null): ReadingAttempt => ({ answer: 0, at })
const right = (at: string | null): ReadingAttempt => ({ answer: question.answer, at })

test('only an actual incorrect submission creates a review item', () => {
  assert.equal(questionReview(question, initialProgress, '2026-11-20'), null)
  const manuallyMarked = { ...structuredClone(initialProgress), vocab: { [question.id]: 'review' as const }, grammar: { [question.id]: 'review' as const } }
  assert.equal(questionReview(question, manuallyMarked, '2026-11-20'), null)
  assert.equal(questionReview(question, record([right('2026-11-19T01:00:00Z')]), '2026-11-20'), null)
  const state = questionReview(question, record([wrong('2026-11-19T01:00:00Z')]), '2026-11-19')!
  assert.equal(state.streak, 0)
  assert.equal(state.dueDate, '2026-11-20')
  assert.equal(state.due, false)
  assert.equal(state.reducedFrequency, false)
  assert.equal(questionReview(question, record([wrong('2026-11-19T01:00:00Z')]), '2026-11-20')!.due, true)
})

test('one correct retry stays frequent; only two real correct retries reduce frequency', () => {
  const first = [wrong('2026-11-19T01:00:00Z'), right('2026-11-20T01:00:00Z')]
  const state = questionReview(question, record(first), '2026-11-20')!
  assert.equal(state.streak, 1)
  assert.equal(state.intervalDays, 1)
  assert.equal(state.dueDate, '2026-11-21')
  assert.equal(state.reducedFrequency, false)
  const twice = questionReview(question, record([...first, right('2026-11-21T01:00:00Z')]), '2026-11-21')!
  assert.equal(twice.streak, 2)
  assert.equal(twice.intervalDays, 3)
  assert.equal(twice.dueDate, '2026-11-24')
  assert.equal(twice.reducedFrequency, true)
  assert.equal(twice.lastWrong, first[0].at)
})

test('subsequent successes use seven and fourteen days; a new error resets the sequence', () => {
  const attempts = [wrong('2026-11-01T01:00:00Z'), right('2026-11-02T01:00:00Z'), right('2026-11-03T01:00:00Z'), right('2026-11-06T01:00:00Z')]
  assert.equal(questionReview(question, record(attempts), '2026-11-06')!.dueDate, '2026-11-13')
  attempts.push(right('2026-11-13T01:00:00Z'))
  assert.equal(questionReview(question, record(attempts), '2026-11-13')!.dueDate, '2026-11-27')
  attempts.push(wrong('2026-11-15T01:00:00Z'))
  const reset = questionReview(question, record(attempts), '2026-11-15')!
  assert.equal(reset.streak, 0)
  assert.equal(reset.intervalDays, 1)
  assert.equal(reset.dueDate, '2026-11-16')
  assert.equal(reset.lastWrong, '2026-11-15T01:00:00Z')
})

test('legacy wrong answers remain reviewable without invented dates or successes', () => {
  const legacy = decodeProgress({ vocab: {}, grammar: {}, readingAnswers: { [question.id]: 0 } }).value
  const state = questionReview(question, legacy, '2026-11-20')!
  assert.equal(state.lastWrong, null)
  assert.equal(state.lastAttempt, null)
  assert.equal(state.dueDate, null)
  assert.equal(state.due, true)
  const undatedCorrect = questionReview(question, record([wrong(null), right(null), right(null)]), '2026-11-20')!
  assert.equal(undatedCorrect.streak, 0)
  assert.equal(undatedCorrect.reducedFrequency, false)
  assert.equal(undatedCorrect.dueDate, null)
})

test('duplicate replay rows cannot manufacture two successful reviews and history stays untouched', () => {
  const attempts = [wrong('2026-11-19T01:00:00Z'), right('2026-11-20T01:00:00Z'), right('2026-11-20T01:00:00Z')]
  const progress = record(attempts), before = structuredClone(progress)
  assert.equal(questionReview(question, progress, '2026-11-20')!.streak, 1)
  assert.deepEqual(progress, before)
})

test('dates are calculated in Tokyo, including the UTC date boundary', () => {
  assert.equal(questionReview(question, record([wrong('2026-11-19T14:59:59Z')]), '2026-11-19')!.dueDate, '2026-11-20')
  assert.equal(questionReview(question, record([wrong('2026-11-19T15:00:00Z')]), '2026-11-20')!.dueDate, '2026-11-21')
  assert.throws(() => questionReview(question, initialProgress, '2026-02-30'), /valid JST/)
})

test('imported ISO timestamps with different timezone offsets use chronological order', () => {
  const progress = record([
    right('2026-11-19T06:00:00+01:00'),
    wrong('2026-11-19T12:00:00+09:00'),
    right('2026-11-19T04:00:00Z'),
  ])
  const before = structuredClone(progress)
  const state = questionReview(question, progress, '2026-11-19')!
  assert.equal(state.lastWrong, '2026-11-19T12:00:00+09:00')
  assert.equal(state.lastAttempt, '2026-11-19T06:00:00+01:00')
  assert.equal(state.streak, 2)
  assert.equal(state.intervalDays, 3)
  assert.equal(state.dueDate, '2026-11-22')
  assert.deepEqual(progress, before)
})

test('a conflicting legacy latest wrong answer is not silently treated as mastered', () => {
  const progress = record([right('2026-11-19T01:00:00Z'), right('2026-11-20T01:00:00Z')], 0)
  const state = questionReview(question, progress, '2026-11-20')!
  assert.equal(state.streak, 0)
  assert.equal(state.lastWrong, null)
  assert.equal(state.dueDate, null)
})

test('stable question links round-trip and invalid destinations are rejected', () => {
  for (const category of ['vocabulary', 'grammar', 'reading'] as const) {
    const id = `2026-11-19-${category}-語/義#1`
    const hash = practiceHref('2026-11-19', category, id)
    assert.deepEqual(parsePracticeHash(hash), { date: '2026-11-19', category, id })
    assert.equal(questionElementId(id), `practice-question-${encodeURIComponent(id)}`)
  }
  for (const hash of ['', '#reading', '#practice/2026-02-30/grammar/q', '#practice/2026-11-19/listening/q', '#practice/2026-11-19/grammar/', '#practice/2026-11-19/grammar/q/extra', '#practice/2026-11-19/grammar/%', '#practice/2026-11-19/grammar/%0A']) {
    assert.equal(parsePracticeHash(hash), null, hash)
  }
  assert.throws(() => practiceHref('2026-02-30', 'grammar', 'q'), /Invalid/)
  assert.throws(() => practiceHref('2026-11-19', 'grammar', ''), /Invalid/)
})
