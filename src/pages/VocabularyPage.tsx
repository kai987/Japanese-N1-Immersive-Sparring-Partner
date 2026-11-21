import { Icon, SectionHeader } from '../components/StudyUI'
import { Fragment } from 'react'
import { StatusButton } from '../components/StudyUI'
import { AudioButton, SentenceAudio } from '../components/AudioButton'
import { StudyReference, ReviewEvidence } from '../components/StudyReference'
import { getCompoundSeriesForWord } from '../lib/compoundCatalog'
import type { PracticePageProps } from './types'

export function VocabularyPage({ lesson, highlight, go, practiceNavigation, practiceContent, progress, updateStatus, openCompoundSeries }: PracticePageProps & { openCompoundSeries: (item: { id: string; word: string }) => void }) {
  return (
  <div className="page-enter">
    <SectionHeader eyebrow="02" title="N1 語彙" description="意味だけでなく、よく使う組み合わせ・使用場面・例文を覚えましょう。" />
    {practiceNavigation}
    {practiceContent}
    {lesson.practice && <h2>語彙学習カード</h2>}
    {lesson.studyVocabularyNote && <p>{lesson.studyVocabularyNote}</p>}
    {lesson.vocabulary.some(item=>item.studyKind) && <p className="study-count">新学 {lesson.vocabulary.filter(item=>item.studyKind==='new').length} ＋ 復習 {lesson.vocabulary.filter(item=>item.studyKind==='review').length} ＝ {lesson.vocabulary.length}語</p>}
    <div className="learning-list">
      {lesson.vocabulary.map((item, index) => {
        const status = progress.vocab[item.id] ?? 'new'
        const hasCompoundSeries = getCompoundSeriesForWord(item.word).length > 0
        return (
          <Fragment key={item.id}>
          {item.studyKind==='review' && (index===0 || lesson.vocabulary[index-1].studyKind!=='review') && <h2 className="review-group-title">本文で復習できる既習語彙</h2>}
          <article className="learning-card" data-study-kind={item.studyKind} data-vocabulary-id={item.id} id={`vocabulary-${item.id}`} tabIndex={-1}>
            <div className="card-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="card-content">
              <div className="word-line">
                <div className="vocabulary-heading"><h3>{highlight(item.word)}</h3><span className="reading">{highlight(item.reading)}</span><AudioButton text={item.word} speechText={item.reading} /></div>
                <div className="vocabulary-meta"><StudyReference item={item} level={item.jlpt} leadingTags={<>
                  {hasCompoundSeries ? <button className="compound-verb-tag" onClick={() => openCompoundSeries(item)} aria-label={`${item.word}の複合動詞シリーズを開く`}>複合動詞</button> : null}
                  <span className="tag">{highlight(item.partOfSpeech)}</span>
                </>} /></div>
              </div>
              <p className="meaning">{highlight(item.meaning)}</p>
              <ReviewEvidence item={item} />
              <div className="example-box"><p><SentenceAudio text={item.example} renderText={highlight} /></p><span>{highlight(item.translation)}</span></div>
              <div className="detail-grid">
                <div><span className="detail-label">よく使う組み合わせ</span><div className="collocations">{item.collocations.map((c) => <span key={c} className="audio-collocation"><span>{highlight(c)}</span><AudioButton text={c} /></span>)}</div></div>
                <div><span className="detail-label">ニュアンス</span><p>{highlight(item.nuance)}</p></div>
              </div>
              <StatusButton status={status} onChange={(next) => updateStatus('vocab', item.id, next)} />
            </div>
          </article>
          </Fragment>
        )
      })}
    </div>
    <div className="section-next"><button className="primary-btn" onClick={() => go('grammar')}>文法の学習へ <Icon name="arrow" size={17} /></button></div>
  </div>
  )
}
