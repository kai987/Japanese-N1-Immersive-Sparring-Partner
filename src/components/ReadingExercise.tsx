import { useEffect, useState } from 'react'
import type { ReadingAttempt, ReadingQuestion } from '../types'
import { readingChoices } from '../lib/reading'
import { splitAudioSentences } from '../lib/audioText'
import { AudioButton, SentenceAudio } from './AudioButton'
import { SearchHighlight } from './SearchHighlight'
import { readQuestionDraft, saveQuestionDraft, clearQuestionDraft, type QuestionDraft } from '../lib/questionDraft'

export function ReadingExercise({ question, day, answered, attempts, onSubmit, searchQuery = '',
  questionLabel = '問題 1', elementId = 'reading-question', fixedOrder = false, audioEnabled = true, startRetry = false,
}: {
  question: ReadingQuestion; day: number; answered: number | undefined
  searchQuery?: string
  questionLabel?: string; elementId?: string; fixedOrder?: boolean; audioEnabled?: boolean; startRetry?: boolean
  attempts: ReadingAttempt[]; onSubmit: (answer: number) => void
}) {
  const [{ selected, retrying }, setDraft] = useState(() => readQuestionDraft(question, answered, attempts, startRetry))
  const changeDraft = (draft: QuestionDraft) => {
    setDraft(draft)
    saveQuestionDraft(question, answered, attempts, draft)
  }
  const clearDraft = () => {
    clearQuestionDraft(question.id)
    setDraft({ selected: null, retrying: false })
  }
  useEffect(() => {
    setDraft(readQuestionDraft(question, answered, attempts, startRetry))
  }, [question.id, startRetry])
  const choices = fixedOrder
    ? question.options.map((text, index) => ({ index, text, note: question.optionNotes[index] }))
    : readingChoices(question, day)
  const submitted = answered !== undefined && !retrying
  const choiceLabel = (displayIndex: number) => fixedOrder ? String(displayIndex + 1) : String.fromCharCode(65 + displayIndex)
  const letter = (canonical: number) => choiceLabel(choices.findIndex(c => c.index === canonical))
  const highlight = (text: string) => <SearchHighlight text={text} query={searchQuery} className="search-hit lesson-search-hit" />
  const questionText = (text: string, japaneseOnly = false) => audioEnabled
    ? <SentenceAudio text={text} renderText={highlight} japaneseOnly={japaneseOnly} /> : highlight(text)
  return <div className="question-block" id={elementId} tabIndex={-1}>
    <div className="question-label">{questionLabel}</div>
    <h3 aria-label={question.prompt}>{questionText(question.prompt)}</h3>
    <div className="answers">
      {choices.map((choice, displayIndex) => {
        const chosen = (submitted ? answered : selected) === choice.index
        const correct = choice.index === question.answer
        return <div className="answer-option-row" key={choice.index}><button
          className={['answer-option', chosen ? 'selected' : '', submitted && correct ? 'correct' : '', submitted && chosen && !correct ? 'wrong' : ''].filter(Boolean).join(' ')}
          aria-pressed={chosen} disabled={submitted} onClick={() => changeDraft({ selected: choice.index, retrying })}>
          <span className="answer-letter">{choiceLabel(displayIndex)}</span><span>{highlight(choice.text)}</span>
        </button>{audioEnabled ? <span className="answer-choice-audio">{splitAudioSentences(choice.text).map((sentence, i) => <AudioButton key={i} text={sentence} />)}</span> : null}</div>
      })}
    </div>
    {!submitted ? <>
      {retrying && answered !== undefined ? <p className="retry-note">再挑戦中です。前回の記録は保存されています。</p> : null}
      <button className="primary-btn submit-answer" disabled={selected === null} onClick={() => {
        if (selected === null) return
        onSubmit(selected); clearDraft()
      }}>回答する</button>
      {retrying && answered !== undefined ? <button className="text-btn retry-cancel" onClick={clearDraft}>前回の結果に戻る</button> : null}
    </> : <div className={`result-panel ${answered === question.answer ? 'success' : 'error'}`} role="status">
      <div className="result-title"><strong>{answered === question.answer ? '正解です' : `正解：${letter(question.answer)}`}</strong></div>
      <p>{questionText(question.explanation, true)}</p>
      <div className="option-notes">{choices.map(choice => <p key={choice.index}><b>{letter(choice.index)}</b>{questionText(choice.note, true)}</p>)}</div>
      <button className="primary-btn" onClick={() => changeDraft({ selected: null, retrying: true })}>もう一度挑戦する</button>
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
