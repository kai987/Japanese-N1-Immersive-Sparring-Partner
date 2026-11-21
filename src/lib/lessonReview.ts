import type { DailyLesson, StoredProgress } from '../types.ts'
import { getAllLessonQuestions, type PracticeQuestionReference } from './practice.ts'
import { questionReview, type QuestionReviewState } from './questionReview.ts'
import { tokyoDate } from './progress.ts'

export type LessonReviewItem = PracticeQuestionReference & { state: QuestionReviewState }

/** Only questions owned by this lesson can enter its actual-mistake queue. */
export function getLessonReviewItems(
  lesson: DailyLesson,
  progress: Pick<StoredProgress, 'readingAnswers' | 'readingAttempts'>,
  todayJst = tokyoDate(),
): LessonReviewItem[] {
  return getAllLessonQuestions(lesson).flatMap(item => {
    const state = questionReview(item.question, progress, todayJst)
    return state ? [{ ...item, state }] : []
  })
}
