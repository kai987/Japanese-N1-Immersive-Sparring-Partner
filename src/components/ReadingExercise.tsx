import { useState } from 'react'
import type { ReadingAttempt, ReadingQuestion } from '../types'
import { readingChoices } from '../lib/reading'
import { splitAudioSentences } from '../lib/audioText'
import { AudioButton, SentenceAudio } from './AudioButton'
import { SearchHighlight } from './SearchHighlight'

export function ReadingExercise({ question, day, answered, attempts, onSubmit, searchQuery = '' }: {
  question: ReadingQuestion; day: number; answered: number | undefined
  searchQuery?: string
  attempts: ReadingAttempt[]; onSubmit: (answer: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [retrying, setRetrying] = useState(false)
  const choices = readingChoices(question, day)
  const submitted = answered !== undefined && !retrying
  const letter = (canonical: number) => String.fromCharCode(65 + choices.findIndex(c => c.index === canonical))
  const highlight = (text: string) => <SearchHighlight text={text} query={searchQuery} className="search-hit lesson-search-hit" />
  return <div className="question-block" id="reading-question" tabIndex={-1}>
    <div className="question-label">問題 1</div>
    <h3 aria-label={question.prompt}><SentenceAudio text={question.prompt} renderText={highlight} /></h3>
    <div className="answers">
      {choices.map((choice, displayIndex) => {
        const chosen = (submitted ? answered : selected) === choice.index
        const correct = choice.index === question.answer
        return <div className="answer-option-row" key={choice.index}><button
          className={['answer-option', chosen ? 'selected' : '', submitted && correct ? 'correct' : '', submitted && chosen && !correct ? 'wrong' : ''].filter(Boolean).join(' ')}
          aria-pressed={chosen} disabled={submitted} onClick={() => setSelected(choice.index)}>
          <span className="answer-letter">{String.fromCharCode(65 + displayIndex)}</span><span>{highlight(choice.text)}</span>
        </button><span className="answer-choice-audio">{splitAudioSentences(choice.text).map((sentence, i) => <AudioButton key={i} text={sentence} />)}</span></div>
      })}
    </div>
    {!submitted ? <>
      {retrying ? <p className="retry-note">再挑戦中です。前回の記録は保存されています。</p> : null}
      <button className="primary-btn submit-answer" disabled={selected === null} onClick={() => {
        if (selected === null) return
        onSubmit(selected); setRetrying(false); setSelected(null)
      }}>回答する</button>
      {retrying ? <button className="text-btn retry-cancel" onClick={() => { setRetrying(false); setSelected(null) }}>前回の結果に戻る</button> : null}
    </> : <div className={`result-panel ${answered === question.answer ? 'success' : 'error'}`} role="status">
      <div className="result-title"><strong>{answered === question.answer ? '正解です' : `正解：${letter(question.answer)}`}</strong></div>
      <p><SentenceAudio text={question.explanation} renderText={highlight} japaneseOnly /></p>
      <div className="option-notes">{choices.map(choice => <p key={choice.index}><b>{letter(choice.index)}</b><SentenceAudio text={choice.note} renderText={highlight} japaneseOnly /></p>)}</div>
      <button className="primary-btn" onClick={() => { setSelected(null); setRetrying(true) }}>もう一度挑戦する</button>
    </div>}
    {attempts.length && !retrying ? <details className="attempt-history">
      <summary>回答履歴（{attempts.length}回）</summary>
      <ol>{attempts.map((attempt, index) => <li key={index}>
        {attempt.at ? new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(attempt.at)) : '以前の記録（日付不明）'}
        {' · '}{letter(attempt.answer)}{' · '}{attempt.answer === question.answer ? '正解' : '不正解'}
      </li>)}</ol>
    </details> : null}
  </div>
}
