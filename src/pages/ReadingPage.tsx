import { Icon, SectionHeader } from '../components/StudyUI'
import type { ReactNode } from 'react'
import { AudioButton, SentenceAudio } from '../components/AudioButton'
import { ReadingExercise } from '../components/ReadingExercise'
import type { LessonPageProps } from './types'
import type { QuestionTarget } from '../lib/appNavigation'
import type { StoredProgress } from '../types'

export function ReadingPage({ lesson, highlight, practiceNavigation, practiceContent, progress, legacyReadingOpen, setLegacyReadingOpen, questionTarget, submitQuestion, lessonHighlightQuery }: Omit<LessonPageProps, 'go'> & { practiceNavigation: ReactNode; practiceContent: ReactNode; progress: StoredProgress; legacyReadingOpen: boolean; setLegacyReadingOpen: (open: boolean) => void; questionTarget: QuestionTarget | null; submitQuestion: (id: string, answer: number) => void; lessonHighlightQuery: string }) {
  return (
  <div className="page-enter reading-page">
    <SectionHeader eyebrow="04" title={lesson.practice ? '読解練習' : '短文読解'} description="筆者の主張・条件・逆接を確認してから、答えを選びましょう。" />
    {practiceNavigation}
    {practiceContent}
    <details className={lesson.practice ? 'legacy-reading' : 'legacy-reading-default'} open={!lesson.practice || legacyReadingOpen} onToggle={event => {
      if (lesson.practice) setLegacyReadingOpen(event.currentTarget.open)
    }}>
    <summary hidden={!lesson.practice}>以前の主旨問題・回答履歴（今回の読解問題数には含めません）</summary>
    <article className="reading-paper quiz-paper">
      <div className="article-head" id="reading-title" tabIndex={-1}><span>JLPT N1 · 読解 · DAY {lesson.day}</span><div className="audio-heading"><h1>{highlight(lesson.reading.title)}</h1><AudioButton text={lesson.reading.title} /></div></div>
      {lesson.reading.paragraphs.map((p, index) => <p className="jp-body" id={`reading-paragraph-${index}`} tabIndex={-1} key={`${lesson.date}-reading-${index}`}><SentenceAudio text={p} renderText={highlight} /></p>)}
      <ReadingExercise key={`${lesson.reading.question.id}:${questionTarget?.questionId === lesson.reading.question.id ? questionTarget.token : 0}`} question={lesson.reading.question}
        day={lesson.day} answered={progress.readingAnswers[lesson.reading.question.id]} attempts={progress.readingAttempts[lesson.reading.question.id] ?? []}
        onSubmit={answer => submitQuestion(lesson.reading.question.id, answer)} searchQuery={lessonHighlightQuery}
        startRetry={questionTarget?.questionId === lesson.reading.question.id && questionTarget.retry} />
    </article>
    </details>
  </div>
  )
}
