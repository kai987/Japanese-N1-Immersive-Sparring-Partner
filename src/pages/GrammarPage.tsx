import { Icon, SectionHeader } from '../components/StudyUI'
import { Fragment } from 'react'
import { StatusButton } from '../components/StudyUI'
import { AudioButton, SentenceAudio } from '../components/AudioButton'
import { StudyReference, ReviewEvidence } from '../components/StudyReference'
import type { PracticePageProps } from './types'

export function GrammarPage({ lesson, highlight, go, practiceNavigation, practiceContent, progress, updateStatus }: PracticePageProps) {
  return (
  <div className="page-enter">
    <SectionHeader eyebrow="03" title="N1 文法" description="意味・接続・文体を確認し、似た表現との違いを整理しましょう。" />
    {practiceNavigation}
    {practiceContent}
    {lesson.practice && <h2>文法学習カード</h2>}
    {lesson.grammarSelectionNote && <p className="grammar-explain" data-grammar-selection-note>{lesson.grammarSelectionNote}</p>}
    {lesson.studyGrammarNote && <p>{lesson.studyGrammarNote}</p>}
    <div className="learning-list grammar-list">
      {lesson.grammar.map((item, index) => {
        const status = progress.grammar[item.id] ?? 'new'
        return (
          <Fragment key={item.id}>
          {item.studyKind==='review' && (index===0 || lesson.grammar[index-1].studyKind!=='review') && <h2 className="review-group-title">本文で復習できる既習文法</h2>}
          <article className="learning-card" data-study-kind={item.studyKind} data-grammar-id={item.id} id={`grammar-${item.id}`} tabIndex={-1}>
            <div className="card-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="card-content">
              <div className="grammar-top"><div><div className="audio-heading"><h3>{highlight(item.pattern)}</h3><AudioButton text={item.pattern} /></div><p className="meaning">{highlight(item.meaning)}</p></div><StudyReference item={item} level={item.level ?? 'N1'} /><div className="frequency" title="読解・表現での実用度"><span>実用度</span><div>{[1,2,3,4,5].map((n) => <i key={n} className={n <= item.frequency ? 'on' : ''} />)}</div></div></div>
              <div className="grammar-meta"><span><b>接続</b>{highlight(item.form)}</span><span><b>文体</b>{highlight(item.register)}</span></div>
              <p className="grammar-explain">{highlight(item.explanation)}</p>
              <ReviewEvidence item={item} />
              <div className="example-box"><p><SentenceAudio text={item.example} renderText={highlight} /></p><span>{highlight(item.translation)}</span></div>
              <div className="compare-box"><span>類似表現との比較</span><p>{highlight(item.comparison)}</p></div>
              <StatusButton status={status} onChange={(next) => updateStatus('grammar', item.id, next)} />
            </div>
          </article>
          </Fragment>
        )
      })}
    </div>
    <div className="section-next"><button className="primary-btn" onClick={() => go('reading')}>読解練習へ <Icon name="arrow" size={17} /></button></div>
  </div>
  )
}
