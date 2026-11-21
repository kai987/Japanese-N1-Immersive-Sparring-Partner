import { Icon, SectionHeader } from '../components/StudyUI'
import { ProgressRing } from '../components/StudyUI'
import { AudioButton } from '../components/AudioButton'
import type { ReactNode } from 'react'
import type { LessonPageProps } from './types'
import type { BrowserHistoryItem } from '../lib/lessonDataTypes'
import type { ReviewFocus } from '../lib/archive'
import type { PracticeCategory, SectionId } from '../types'

export function TodayPage({ lesson, highlight, go, isLatest, historyEntry, today, progressValue, practiceNavigation, practiceQuestionCount, practiceCount, reviewCount, reviewFocus }: LessonPageProps & { isLatest: boolean; historyEntry?: BrowserHistoryItem; today: string; progressValue: number; practiceNavigation: ReactNode; practiceQuestionCount: number; practiceCount: (category: PracticeCategory) => number; reviewCount: number; reviewFocus: ReviewFocus[] }) {
  return (
  <div className="page-enter">
    {!isLatest ? (
      <div className={`archive-note ${historyEntry?.merged ? 'merged' : ''}`}>
        <Icon name="history" size={18} />
        <span>{historyEntry?.merged ? 'この日の学習教材と誤答復習をまとめたアーカイブです。' : 'この日の学習教材を表示しています。'}</span>
      </div>
    ) : null}

    <section className="hero">
      <div className="hero-copy" id="lesson-theme" tabIndex={-1}>
        <div className="day-label">{lesson.date === today ? '今日のテーマ' : `DAY ${lesson.day} · ARCHIVE`}</div>
        <div className="audio-heading"><h1>{highlight(lesson.title)}{lesson.issueNumber ? `（第${lesson.issueNumber}号）` : null}</h1><AudioButton text={lesson.title} /></div>
        <p>{highlight(lesson.subtitle)}</p>
        {lesson.issueNumber && <small className="source-issue">IT/AI 日报第{lesson.issueNumber}号 · N1 学習計画 Day {lesson.day}（別の番号です）</small>}
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => go('immersion')}>{isLatest ? '学習を始める' : 'この日の学習を開く'} <Icon name="arrow" size={17} /></button>
          <button className="text-btn" onClick={() => go('review')}>この日の復習を見る</button>
        </div>
      </div>
      <ProgressRing value={progressValue} />
    </section>

    <section className="summary-strip" aria-label="学習の概要">
      <div><span>計画の進捗</span><strong>{lesson.day}<small> / 99</small></strong></div>
      <div><span>{lesson.practice ? '分類練習の目安' : '学習時間の目安'}</span><strong>{lesson.practice?.estimatedMinutes ?? lesson.estimatedMinutes}<small> min</small></strong></div>
      <div><span>この日の語彙</span><strong>{lesson.vocabulary.length}<small> 項目</small></strong></div>
      <div><span>この日の文法</span><strong>{lesson.grammar.length}<small> 項目</small></strong></div>
    </section>

    <section className="today-plan">
      <SectionHeader eyebrow="TODAY" title="学習の進め方" description={lesson.practice ? `分類練習は約 ${lesson.practice.estimatedMinutes} 分。聴解・没入学習・振り返りは当日の学習計画に沿って進めましょう。` : `全体の学習時間は約 ${lesson.estimatedMinutes} 分。以下から各教材・練習へ進めます。`} />
      {practiceNavigation}
      {lesson.practice && <p className="practice-help">今回の{practiceQuestionCount}問の目安は{lesson.practice.estimatedMinutes}分です。元の学習計画のJLPT演習内で取り組み、聴解と振り返りの時間は各日の学習計画に従ってください。一日の総学習時間は増やしません。</p>}
      <div className="plan-list">
        {[
          ['01', '没入読解', 'まず日本語で読み、必要に応じて対訳や解説を確認しましょう。', '8 min', 'immersion' as SectionId],
          ['02', 'N1 語彙', lesson.practice ? `語彙問題${practiceCount('vocabulary')}問。学習カード${lesson.vocabulary.length}語は別に確認できます。` : `${lesson.vocabulary.length}語の重点語彙を、組み合わせ・例文・ニュアンスとともに学びます。`, '7 min', 'vocabulary' as SectionId],
          ['03', 'N1 文法', lesson.practice ? `文法問題${practiceCount('grammar')}問。文法形式・文の組み立て・文章の文法を練習します。` : `${lesson.grammar.length}項目の重点文型を、接続や類似表現とともに学びます。`, lesson.practice ? '8 min' : '6 min', 'grammar' as SectionId],
          ['04', '読解練習', lesson.practice ? `短文・中篇・長文・比較・情報検索の${practiceCount('reading')}問。各選択肢の根拠は回答後に確認します。` : '主旨を問う読解問題です。回答後に各選択肢の根拠を確認します。', lesson.practice ? '40 min' : '7 min', 'reading' as SectionId],
          ['05', '誤答復習', `この日に実際に間違えた${reviewCount}問。クリックして元の問題へ戻ります。`, '5 min', 'review' as SectionId],
        ].map(([num, title, desc, time, id]) => (
          <button className="plan-row" key={String(id)} onClick={() => go(id as SectionId)}>
            <span className="plan-num">{num}</span>
            <span className="plan-main"><strong>{title}</strong><small>{desc}</small></span>
            <span className="plan-time">{time}</span>
            <Icon name="arrow" size={17} />
          </button>
        ))}
      </div>
    </section>

    <section className="focus-note">
      <div className="focus-icon"><Icon name="target" size={21} /></div>
      <div><strong>{isLatest ? '今回の練習ポイント' : 'この日の復習方法'}</strong><p>意味を読むだけで終わらず、画面を閉じて自分の日本語で語句や文型を説明してみましょう。復習では苦手な項目を確認します。</p></div>
    </section>
    {reviewFocus.length > 0 && <section className="supplementary-points" aria-label="補充知識">
      <h2>補充知識・復習の観点</h2><p>教材の学習ポイントです。実際の誤答記録には含めません。</p>
      {reviewFocus.map((item, index) => <article className="supplementary-point" id={`review-${index}`} tabIndex={-1} key={`${lesson.date}-${index}`}>
        <h3>{highlight(item.title)}</h3><p>{highlight(item.detail)}</p>
      </article>)}
    </section>}
  </div>
  )
}
