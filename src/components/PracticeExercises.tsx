import type { DailyLesson, PracticeCategory, StoredProgress } from '../types'
import { ReadingExercise } from './ReadingExercise'
import { SearchHighlight } from './SearchHighlight'
import { questionElementId } from '../lib/questionReview'

export const practiceCategoryLabels: Record<PracticeCategory, string> = {
  vocabulary: '語彙問題', grammar: '文法問題', reading: '読解問題',
}

export function PracticeExercises({ lesson, category, progress, onSubmit, searchQuery = '', retryTarget }: {
  lesson: DailyLesson
  category: PracticeCategory
  progress: StoredProgress
  onSubmit: (id: string, answer: number) => void
  searchQuery?: string
  retryTarget?: { questionId: string; token: number } | null
}) {
  const practice = lesson.practice
  if (!practice) return null
  const groups = practice.groups.filter(group => group.category === category)
  const questions = groups.flatMap(group => group.questions)
  const completed = questions.filter(question => progress.readingAnswers[question.id] !== undefined).length
  const highlight = (text: string) => <SearchHighlight text={text} query={searchQuery} className="search-hit lesson-search-hit" />
  return <section className="practice-section" aria-label={practiceCategoryLabels[category]} data-practice-category={category}>
    <header className="practice-intro">
      <div><span className="section-index">ORIGINAL N1 PRACTICE</span><h2>{practiceCategoryLabels[category]} <small>{questions.length}問</small></h2></div>
      <p className="practice-completion">回答済み {completed} / {questions.length}</p>
      <p>{practice.sourceNote}</p>
      <p>一つ選んで「回答する」を押すと採点します。解答・解説は提出後に表示します。</p>
    </header>
    <nav className="practice-group-links" aria-label={`${practiceCategoryLabels[category]}の問題一覧`}>
      {groups.map(group => <a href={`#${group.id}`} key={group.id} onClick={event => {
        event.preventDefault()
        const target = document.getElementById(group.id)
        target?.scrollIntoView({ block: 'start', behavior: 'instant' }); target?.focus({ preventScroll: true })
      }}>{group.title}<span>{group.questions.length}問</span></a>)}
    </nav>
    {groups.map(group => <article className="reading-paper practice-paper" id={group.id} tabIndex={-1} key={group.id} data-practice-kind={group.kind}>
      <header className="practice-group-header"><h3>{highlight(group.title)}</h3><p>{highlight(group.instructions)}</p></header>
      {group.paragraphs.map((paragraph, index) => <p className="jp-body" key={index}>{highlight(paragraph)}</p>)}
      {group.table ? <div className="practice-table-scroll" role="region" aria-label={group.table.caption} tabIndex={0}>
        <table className="practice-table"><caption>{highlight(group.table.caption)}</caption>
          <thead><tr>{group.table.headers.map((header, index) => <th key={index} scope="col">{highlight(header)}</th>)}</tr></thead>
          <tbody>{group.table.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0
            ? <th scope="row" key={cellIndex}>{highlight(cell)}</th> : <td key={cellIndex}>{highlight(cell)}</td>)}</tr>)}</tbody>
        </table>
      </div> : null}
      {group.questions.map(question => <div className="practice-question" data-question-id={question.id} key={question.id}>
        <ReadingExercise key={`${question.id}:${retryTarget?.questionId === question.id ? retryTarget.token : 0}`}
          question={question} day={lesson.day} answered={progress.readingAnswers[question.id]}
          attempts={progress.readingAttempts[question.id] ?? []} onSubmit={answer => onSubmit(question.id, answer)}
          questionLabel={`問題 ${questions.findIndex(item => item.id === question.id) + 1}${question.questionType ? ` · ${question.questionType}` : ''}`}
          elementId={questionElementId(question.id)} fixedOrder audioEnabled={false}
          startRetry={retryTarget?.questionId === question.id} searchQuery={searchQuery} />
        {group.paragraphs.length || group.table ? <button className="text-btn practice-back-to-passage" onClick={() => {
          const target = document.getElementById(group.id)
          target?.scrollIntoView({ block: 'start', behavior: 'instant' }); target?.focus({ preventScroll: true })
        }}>この問題の本文に戻る</button> : null}
      </div>)}
    </article>)}
  </section>
}
