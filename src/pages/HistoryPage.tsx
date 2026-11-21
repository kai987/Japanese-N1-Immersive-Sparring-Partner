import { Icon, SectionHeader } from '../components/StudyUI'
import { lazy, Suspense } from 'react'
import { ResourceBoundary } from '../components/ResourceBoundary'
import { historyItems, lesson as latestLesson } from '../data/history'
import type { DailyLesson } from '../types'

const ProgressBackup = lazy(() => import('../components/ProgressBackup'))

export function HistoryPage({ lesson, today, openLesson, searchQuery }:  { lesson: DailyLesson; today: string; openLesson: (date: string) => void; searchQuery: string }) {
  return (
  <div className="page-enter">
    <SectionHeader eyebrow="HISTORY" title="N1 学習アーカイブ" description="2026年8月30日（Day 1）からの教材を収録しています。日付を選んで学習を再開できます。" />
    <section className="history-summary">
      <div><span>現在の計画</span><strong>{latestLesson.day}<small> / 99</small></strong></div>
      <div><span>収録教材</span><strong>{historyItems.length}<small> 日</small></strong></div>
      <div><span>復習を統合した教材</span><strong>{historyItems.filter((item) => item.merged).length}<small> 日</small></strong></div>
    </section>
    <ResourceBoundary searchQuery={searchQuery}><Suspense fallback={<p role="status">学習記録を読み込んでいます…</p>}><ProgressBackup /></Suspense></ResourceBoundary>
    <div className="history-table-wrap">
      <div className="history-head"><span>日付</span><span>テーマ</span><span>目安時間</span><span>状態</span></div>
      {historyItems.map((item) => {
        const current = item.date === lesson.date
        const latest = item.date === latestLesson.date
        return (
          <button className={`history-row history-row-button ${current ? 'selected' : ''}`} key={item.date} onClick={() => openLesson(item.date)}>
            <span><b>{item.date.slice(5).replace('-', '/')}</b><small>Day {item.day}</small></span>
            <span className="history-title">{item.title}</span>
            <span>{item.minutes} min</span>
            <span className={`history-status ${item.merged ? 'merged' : ''}`}>{item.date === today ? '今日' : latest ? '最新' : item.merged ? '復習統合' : '収録済み'}</span>
          </button>
        )
      })}
    </div>
    <div className="history-note"><Icon name="layers" size={20} /><p>8月30日〜9月4日の教材は、学習と誤答復習を日付ごとに統合しています。各日の没入読解・語彙・文法・読解・復習を確認できます。</p></div>
  </div>
  )
}
