import test from 'node:test'
import assert from 'node:assert/strict'
import { validateContent } from '../scripts/validate-content.ts'
import { getAllLessonQuestions } from '../src/lib/practice.ts'
import { getLessonReviewItems } from '../src/lib/lessonReview.ts'
import { initialProgress, decodeProgress } from '../src/lib/progress.ts'

const lessons = validateContent().lessons
const today = '2026-11-22'

test('every archived and active question stays in its owning date across the complete lesson matrix', () => {
  for (const source of lessons) {
    const questions = getAllLessonQuestions(source)
    const progress = structuredClone(initialProgress)
    for (const { question } of questions) {
      const answer = (question.answer + 1) % 4
      progress.readingAnswers[question.id] = answer
      progress.readingAttempts[question.id] = [{ answer, at: '2026-11-21T01:00:00.000Z' }]
    }
    const before = structuredClone(progress)
    for (const destination of lessons) {
      const review = getLessonReviewItems(destination, progress, today)
      assert.deepEqual(review.map(item => item.question.id), destination.date === source.date
        ? questions.map(item => item.question.id) : [], `${source.date} -> ${destination.date}`)
      if (destination.date === source.date) {
        assert.deepEqual(review.map(item => item.category), questions.map(item => item.category))
        assert.ok(review.every(item => item.state.streak === 0 && item.state.due))
      }
    }
    assert.deepEqual(progress, before, `${source.date}: selecting review items must not rewrite history`)
  }
})

test('the complete catalog excludes unanswered, first-correct and unknown question IDs', () => {
  const progress = structuredClone(initialProgress)
  progress.readingAnswers['unknown-retired-question'] = 1
  for (const lesson of lessons) {
    for (const { question } of getAllLessonQuestions(lesson)) {
      progress.readingAnswers[question.id] = question.answer
      progress.readingAttempts[question.id] = [{ answer: question.answer, at: '2026-11-21T01:00:00.000Z' }]
    }
    assert.deepEqual(getLessonReviewItems(lesson, initialProgress, today), [])
  }
  for (const lesson of lessons) assert.deepEqual(getLessonReviewItems(lesson, progress, today), [])
})

test('legacy undated mistakes remain tied to their original questions after migration', () => {
  const readingAnswers = Object.fromEntries(lessons.map(lesson => [lesson.reading.question.id, (lesson.reading.question.answer + 1) % 4]))
  const progress = decodeProgress({ vocab: {}, grammar: {}, readingAnswers }).value
  for (const lesson of lessons) {
    const review = getLessonReviewItems(lesson, progress, today)
    assert.deepEqual(review.map(item => item.question.id), [lesson.reading.question.id])
    assert.equal(review[0].state.lastAttempt, null)
    assert.equal(review[0].state.streak, 0)
    assert.equal(review[0].state.due, true)
  }
})
