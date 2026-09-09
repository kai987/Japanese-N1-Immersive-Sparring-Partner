import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DailySearch } from './components/DailySearch'
import { DateDropdown } from './components/DateDropdown'
import { getLessonByDate, historyItems, lesson as latestLesson, reviewFocusByDate } from './data/history'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { LearningStatus, ReadingMode, SectionId, StoredProgress } from './types'
import { ReadingExercise } from './components/ReadingExercise'
import { initialProgress, decodeProgress, decodeCompleted, decodeTheme, recordStudy, streakFor, tokyoDate } from './lib/progress'
import './history.css'

const navigation: { id: SectionId; label: string; short: string }[] = [
  { id: 'today', label: '今日の学習', short: '今日' },
  { id: 'immersion', label: '没入読解', short: '没入' },
  { id: 'vocabulary', label: 'N1 語彙', short: '語彙' },
  { id: 'grammar', label: 'N1 文法', short: '文法' },
  { id: 'reading', label: '読解練習', short: '読解' },
  { id: 'review', label: '誤答復習', short: '復習' },
  { id: 'history', label: '学習履歴', short: '履歴' },
]

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    flame: <path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.4-4.5-8.2.1 2-1 3.5-2.2 4.4.3-3.8-1.3-6.9-4.8-9.2.2 3.2-1.7 5-3.1 6.8C3.2 10.2 3 12 3 14c0 4.4 4 8 9 8z"/>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    spark: <path d="m12 2 1.2 4.3L17 8l-3.8 1.7L12 14l-1.2-4.3L7 8l3.8-1.7L12 2ZM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z"/>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    pen: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? paths.book}
    </svg>
  )
}

function StatusButton({ status, onChange }: { status: LearningStatus; onChange: (status: LearningStatus) => void }) {
  return (
    <div className="status-actions" aria-label="学習状態">
      <button className={status === 'review' ? 'status-btn active review' : 'status-btn'} onClick={() => onChange(status === 'review' ? 'new' : 'review')}>要復習</button>
      <button className={status === 'mastered' ? 'status-btn active mastered' : 'status-btn'} onClick={() => onChange(status === 'mastered' ? 'new' : 'mastered')}>
        <Icon name="check" size={15} /> 習得済み
      </button>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dash = (value / 100) * circumference
  return (
    <div className="progress-ring-wrap" aria-label={`この日の進捗 ${value}%`}>
      <svg className="progress-ring" viewBox="0 0 100 100" role="img">
        <circle className="progress-ring-track" cx="50" cy="50" r={radius} />
        <circle className="progress-ring-value" cx="50" cy="50" r={radius} strokeDasharray={`${dash} ${circumference - dash}`} />
      </svg>
      <div className="progress-ring-label"><strong>{value}%</strong><span>この日</span></div>
    </div>
  )
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="section-header">
      <div className="section-index">{eyebrow}</div>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  )
}

export default function App() {
  const [active, setActive] = useState<SectionId>('today')
  const [selectedDate, setSelectedDate] = useState(latestLesson.date)
  const [readingMode, setReadingMode] = useState<ReadingMode>('japanese')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme, themeStorage] = useLocalStorage('n1-theme', 'light', decodeTheme)
  const [progress, setProgress, progressStorage] = useLocalStorage<StoredProgress>('n1-progress', initialProgress, decodeProgress)
  const [completedLessons, setCompletedLessons, completedStorage] = useLocalStorage<Record<string, boolean>>('n1-completed-lessons', {}, decodeCompleted)
  const storageStates = [themeStorage, progressStorage, completedStorage]
  const [today, setToday] = useState(tokyoDate)
  useEffect(() => {
    const refresh = () => setToday(tokyoDate())
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])

  const lesson = getLessonByDate(selectedDate)
  const isLatest = lesson.date === latestLesson.date
  const historyEntry = historyItems.find((item) => item.date === lesson.date)
  const streakDisplay = streakFor(progress.studyDates, today)

  useEffect(() => {
    setReadingMode('japanese')
  }, [lesson.date])

  const answered = progress.readingAnswers[lesson.reading.question.id]
  const answerIsCorrect = answered === lesson.reading.question.answer

  const progressValue = useMemo(() => {
    const vocabDone = lesson.vocabulary.filter((item) => progress.vocab[item.id] === 'mastered').length
    const grammarDone = lesson.grammar.filter((item) => progress.grammar[item.id] === 'mastered').length
    const readingDone = answered !== undefined ? 1 : 0
    const immersionDone = completedLessons[lesson.date] ? 1 : 0
    const total = lesson.vocabulary.length + lesson.grammar.length + 2
    return Math.round(((vocabDone + grammarDone + readingDone + immersionDone) / total) * 100)
  }, [answered, completedLessons, lesson, progress])

  const reviewItems = useMemo(() => {
    const scheduled: { type: string; title: string; detail: string; section?: SectionId }[] = (reviewFocusByDate[lesson.date] ?? []).map(item => ({ ...item, type: item.type === '词汇' ? '語彙' : item.type === '读解' ? '読解' : item.type }))
    const vocab = lesson.vocabulary
      .filter((item) => progress.vocab[item.id] === 'review')
      .map((item) => ({ type: '語彙', section: 'vocabulary' as SectionId, title: item.word, detail: `${item.reading} · ${item.meaning}` }))
    const grammar = lesson.grammar
      .filter((item) => progress.grammar[item.id] === 'review')
      .map((item) => ({ type: '文法', section: 'grammar' as SectionId, title: item.pattern, detail: item.meaning }))
    const wrongReading = answered !== undefined && !answerIsCorrect
      ? [{ type: '読解', section: 'reading' as SectionId, title: lesson.reading.question.prompt, detail: '本文に戻り、主張を支える根拠を確認しましょう。' }]
      : []
    return [...scheduled, ...vocab, ...grammar, ...wrongReading]
  }, [answered, answerIsCorrect, lesson, progress])

  const go = (section: SectionId) => {
    setActive(section)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openLesson = (date: string, section: SectionId = 'today') => {
    setSelectedDate(date)
    setActive(section)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateStatus = (kind: 'vocab' | 'grammar', id: string, status: LearningStatus) => {
    setProgress((prev) => recordStudy({ ...prev, [kind]: { ...prev[kind], [id]: status } }))
    setToday(tokyoDate())
  }

  const markImmersionComplete = () => {
    setCompletedLessons((prev) => ({ ...prev, [lesson.date]: !prev[lesson.date] }))
    if (!completedLessons[lesson.date]) setProgress(prev => recordStudy(prev))
    setToday(tokyoDate())
  }

  const submitReading = (answer: number) => {
    const id = lesson.reading.question.id
    const at = new Date().toISOString()
    setProgress(prev => recordStudy({ ...prev,
      readingAnswers: { ...prev.readingAnswers, [id]: answer },
      readingAttempts: { ...prev.readingAttempts, [id]: [...(prev.readingAttempts[id] ?? []), { answer, at }] },
    }))
    setToday(tokyoDate())
  }

  return (
    <div className="app" data-theme={theme}>
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="brand" onClick={() => openLesson(latestLesson.date)} role="button" tabIndex={0} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLesson(latestLesson.date) }
        }}>
          <div className="brand-mark">N1</div>
          <div><strong>没入型</strong><span>学習パートナー</span></div>
        </div>

        <nav className="side-nav" aria-label="メインナビゲーション">
          {navigation.map((item) => (
            <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => go(item.id)}>
              <span className="nav-icon"><Icon name={item.id === 'today' ? 'spark' : item.id === 'history' ? 'history' : item.id === 'reading' ? 'pen' : item.id === 'review' ? 'target' : 'book'} size={18} /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-streak"><Icon name="flame" size={18} /><span><strong>{streakDisplay}日</strong> 連続学習</span></div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="表示テーマを切り替える">
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'ダークモード' : 'ライトモード'}</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen ? <button className="mobile-overlay" aria-label="ナビゲーションを閉じる" onClick={() => setMobileNavOpen(false)} /> : null}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="ナビゲーションを開く"><Icon name="menu" /></button>
          <DateDropdown date={lesson.date} day={lesson.day} activeSection={active} onOpen={openLesson} />
          <DailySearch onOpen={openLesson} />
          <div className="topbar-actions">
            <div className="quiet-stat"><Icon name="clock" size={17} /><span>約 {lesson.estimatedMinutes} 分</span></div>
            <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="読解テーマを切り替える"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
          </div>
        </header>

        <div className="content-shell">
          {storageStates.some(state => state.failed) ? <div className="storage-notice" role="alert">
            <p>このブラウザーに学習記録を保存できません。学習は続けられますが、ページを閉じると今回の変更が失われる可能性があります。</p>
            <button className="text-btn" onClick={() => storageStates.forEach(state => state.retry())}>保存を再試行</button>
          </div> : storageStates.some(state => state.recovered) ? <div className="storage-notice" role="status">
            <p>保存データの一部を読み込めなかったため、その部分を初期状態に戻しました。読み込めた学習記録は保持しています。</p>
            <button className="text-btn" onClick={() => storageStates.forEach(state => state.dismiss())}>閉じる</button>
          </div> : null}
          {active === 'today' && (
            <div className="page-enter">
              {!isLatest ? (
                <div className={`archive-note ${historyEntry?.merged ? 'merged' : ''}`}>
                  <Icon name="history" size={18} />
                  <span>{historyEntry?.merged ? 'この日の学習教材と誤答復習をまとめたアーカイブです。' : 'この日の学習教材を表示しています。'}</span>
                </div>
              ) : null}

              <section className="hero">
                <div className="hero-copy">
                  <div className="day-label">{lesson.date === today ? '今日のテーマ' : `DAY ${lesson.day} · ARCHIVE`}</div>
                  <h1>{lesson.title}</h1>
                  <p>{lesson.subtitle}</p>
                  <div className="hero-actions">
                    <button className="primary-btn" onClick={() => go('immersion')}>{isLatest ? '学習を始める' : 'この日の学習を開く'} <Icon name="arrow" size={17} /></button>
                    <button className="text-btn" onClick={() => go('review')}>この日の復習を見る</button>
                  </div>
                </div>
                <ProgressRing value={progressValue} />
              </section>

              <section className="summary-strip" aria-label="学習の概要">
                <div><span>計画の進捗</span><strong>{lesson.day}<small> / 99</small></strong></div>
                <div><span>学習時間の目安</span><strong>{lesson.estimatedMinutes}<small> min</small></strong></div>
                <div><span>この日の語彙</span><strong>{lesson.vocabulary.length}<small> 項目</small></strong></div>
                <div><span>この日の文法</span><strong>{lesson.grammar.length}<small> 項目</small></strong></div>
              </section>

              <section className="today-plan">
                <SectionHeader eyebrow="TODAY" title="学習の進め方" description={`約 ${lesson.estimatedMinutes} 分で学習します。過去の教材にも、その日の復習ポイントを収録しています。`} />
                <div className="plan-list">
                  {[
                    ['01', '没入読解', 'まず日本語で読み、必要に応じて対訳や解説を確認しましょう。', '8 min', 'immersion' as SectionId],
                    ['02', 'N1 語彙', `${lesson.vocabulary.length}語の重点語彙を、組み合わせ・例文・ニュアンスとともに学びます。`, '7 min', 'vocabulary' as SectionId],
                    ['03', 'N1 文法', `${lesson.grammar.length}項目の重点文型を、接続や類似表現とともに学びます。`, '6 min', 'grammar' as SectionId],
                    ['04', '短文読解', '主旨を問う読解問題です。回答後に各選択肢の根拠を確認します。', '7 min', 'reading' as SectionId],
                    ['05', '誤答復習', `${reviewFocusByDate[lesson.date]?.length ?? 0}項目の誤答・苦手分野を復習します。`, '5 min', 'review' as SectionId],
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
            </div>
          )}

          {active === 'immersion' && (
            <div className="page-enter reading-page">
              <SectionHeader eyebrow="01" title="没入読解" description="まずは日本語だけで読み、分からない部分は前後の文脈から推測しましょう。" />
              <div className="mode-switch" role="group" aria-label="読解の表示モード">
                {([['japanese', '日本語のみ'], ['bilingual', '日中対訳'], ['analysis', '解説']] as [ReadingMode, string][]).map(([mode, label]) => (
                  <button key={mode} className={readingMode === mode ? 'active' : ''} onClick={() => setReadingMode(mode)}>{label}</button>
                ))}
              </div>

              <article className="reading-paper">
                <div className="article-head"><span>N1 IMMERSION · DAY {lesson.day}</span><h1>{lesson.immersion.title}</h1></div>
                {lesson.immersion.paragraphs.map((p, index) => (
                  <div className="paragraph-block" key={`${lesson.date}-${index}`}>
                    <p className="jp-body">{p}</p>
                    {readingMode === 'bilingual' ? <p className="zh-translation">{lesson.immersion.translations[index]}</p> : null}
                    {readingMode === 'analysis' ? <div className="analysis-note"><span>POINT {index + 1}</span><p>{lesson.immersion.analysis[index]}</p></div> : null}
                  </div>
                ))}
                <div className="article-finish">
                  <button className={completedLessons[lesson.date] ? 'complete-btn completed' : 'complete-btn'} onClick={markImmersionComplete}>
                    <Icon name="check" size={17} /> {completedLessons[lesson.date] ? '読了済み' : '読了にする'}
                  </button>
                  <button className="next-link" onClick={() => go('vocabulary')}>次へ：N1 語彙 <Icon name="arrow" size={16} /></button>
                </div>
              </article>
            </div>
          )}

          {active === 'vocabulary' && (
            <div className="page-enter">
              <SectionHeader eyebrow="02" title="N1 語彙" description="意味だけでなく、よく使う組み合わせ・使用場面・例文を覚えましょう。" />
              <div className="learning-list">
                {lesson.vocabulary.map((item, index) => {
                  const status = progress.vocab[item.id] ?? 'new'
                  return (
                    <article className="learning-card" key={item.id}>
                      <div className="card-index">{String(index + 1).padStart(2, '0')}</div>
                      <div className="card-content">
                        <div className="word-line"><div><h3>{item.word}</h3><span className="reading">{item.reading}</span></div><span className="tag">{item.partOfSpeech}</span></div>
                        <p className="meaning">{item.meaning}</p>
                        <div className="example-box"><p>{item.example}</p><span>{item.translation}</span></div>
                        <div className="detail-grid">
                          <div><span className="detail-label">よく使う組み合わせ</span><div className="collocations">{item.collocations.map((c) => <span key={c}>{c}</span>)}</div></div>
                          <div><span className="detail-label">ニュアンス</span><p>{item.nuance}</p></div>
                        </div>
                        <StatusButton status={status} onChange={(next) => updateStatus('vocab', item.id, next)} />
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="section-next"><button className="primary-btn" onClick={() => go('grammar')}>文法の学習へ <Icon name="arrow" size={17} /></button></div>
            </div>
          )}

          {active === 'grammar' && (
            <div className="page-enter">
              <SectionHeader eyebrow="03" title="N1 文法" description="意味・接続・文体を確認し、似た表現との違いを整理しましょう。" />
              <div className="learning-list grammar-list">
                {lesson.grammar.map((item, index) => {
                  const status = progress.grammar[item.id] ?? 'new'
                  return (
                    <article className="learning-card" key={item.id}>
                      <div className="card-index">{String(index + 1).padStart(2, '0')}</div>
                      <div className="card-content">
                        <div className="grammar-top"><div><h3>{item.pattern}</h3><p className="meaning">{item.meaning}</p></div><div className="frequency" title="読解・表現での実用度"><span>実用度</span><div>{[1,2,3,4,5].map((n) => <i key={n} className={n <= item.frequency ? 'on' : ''} />)}</div></div></div>
                        <div className="grammar-meta"><span><b>接続</b>{item.form}</span><span><b>文体</b>{item.register}</span></div>
                        <p className="grammar-explain">{item.explanation}</p>
                        <div className="example-box"><p>{item.example}</p><span>{item.translation}</span></div>
                        <div className="compare-box"><span>類似表現との比較</span><p>{item.comparison}</p></div>
                        <StatusButton status={status} onChange={(next) => updateStatus('grammar', item.id, next)} />
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="section-next"><button className="primary-btn" onClick={() => go('reading')}>読解練習へ <Icon name="arrow" size={17} /></button></div>
            </div>
          )}

          {active === 'reading' && (
            <div className="page-enter reading-page">
              <SectionHeader eyebrow="04" title="短文読解" description="筆者の主張・条件・逆接を確認してから、答えを選びましょう。" />
              <article className="reading-paper quiz-paper">
                <div className="article-head"><span>JLPT N1 · 読解 · DAY {lesson.day}</span><h1>{lesson.reading.title}</h1></div>
                {lesson.reading.paragraphs.map((p, index) => <p className="jp-body" key={`${lesson.date}-reading-${index}`}>{p}</p>)}
                <ReadingExercise key={lesson.reading.question.id} question={lesson.reading.question}
                  day={lesson.day} answered={answered} attempts={progress.readingAttempts[lesson.reading.question.id] ?? []}
                  onSubmit={submitReading} />
              </article>
            </div>
          )}

          {active === 'review' && (
            <div className="page-enter">
              <SectionHeader eyebrow="REVIEW" title="誤答・苦手分野の復習" description="この日の復習ポイントと、要復習にした語彙・文法、未克服の読解問題を表示します。" />
              {reviewItems.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><Icon name="check" size={26} /></div><h3>この日の復習項目はありません</h3><p>語彙・文法で「要復習」を選ぶと追加されます。読解で間違えた問題もここに表示します。</p><button className="text-btn" onClick={() => go('vocabulary')}>学習へ</button></div>
              ) : (
                <div className="review-list">
                  {reviewItems.map((item, index) => <div className="review-row" key={`${item.type}-${item.title}-${index}`}><span className="review-number">{index + 1}</span><span className="review-type">{item.type}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div>{item.section ? <button className="text-btn" onClick={() => go(item.section!)} aria-label={`${item.title}を復習する`}>復習する</button> : null}</div>)}
                </div>
              )}
              <section className="spaced-review">
                <div><span className="section-index">SPACED REVIEW</span><h3>復習間隔の目安</h3><p>1・3・7・14・30日後を目安に、自分で思い出す練習をしましょう。</p></div>
                <div className="intervals"><span>1 日</span><i /><span>3 日</span><i /><span>7 日</span><i /><span>14 日</span><i /><span>30 日</span></div>
              </section>
            </div>
          )}

          {active === 'history' && (
            <div className="page-enter">
              <SectionHeader eyebrow="HISTORY" title="N1 学習アーカイブ" description="2026年8月30日（Day 1）からの教材を収録しています。日付を選んで学習を再開できます。" />
              <section className="history-summary">
                <div><span>現在の計画</span><strong>{latestLesson.day}<small> / 99</small></strong></div>
                <div><span>収録教材</span><strong>{historyItems.length}<small> 日</small></strong></div>
                <div><span>復習を統合した教材</span><strong>{historyItems.filter((item) => item.merged).length}<small> 日</small></strong></div>
              </section>
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
          )}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="モバイルクイックナビゲーション">
        {navigation.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.short}</span></button>)}
      </nav>
    </div>
  )
}