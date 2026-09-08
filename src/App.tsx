import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DailySearch } from './components/DailySearch'
import { getLessonByDate, historyItems, lesson as latestLesson, reviewFocusByDate } from './data/history'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { LearningStatus, ReadingMode, SectionId, StoredProgress } from './types'
import './history.css'

const initialProgress: StoredProgress = {
  vocab: {},
  grammar: {},
  readingAnswers: {},
  completedSections: [],
  streak: 11,
  minutesThisWeek: 164,
}

const navigation: { id: SectionId; label: string; short: string }[] = [
  { id: 'today', label: '今日学习', short: '今日' },
  { id: 'immersion', label: '沉浸阅读', short: '阅读' },
  { id: 'vocabulary', label: 'N1 词汇', short: '词汇' },
  { id: 'grammar', label: 'N1 文法', short: '文法' },
  { id: 'reading', label: '读解练习', short: '读解' },
  { id: 'review', label: '错题复习', short: '复习' },
  { id: 'history', label: '历史日报', short: '历史' },
]

const formatDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parsed)
}

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
    <div className="status-actions" aria-label="学习状态">
      <button className={status === 'review' ? 'status-btn active review' : 'status-btn'} onClick={() => onChange(status === 'review' ? 'new' : 'review')}>需要复习</button>
      <button className={status === 'mastered' ? 'status-btn active mastered' : 'status-btn'} onClick={() => onChange(status === 'mastered' ? 'new' : 'mastered')}>
        <Icon name="check" size={15} /> 已掌握
      </button>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dash = (value / 100) * circumference
  return (
    <div className="progress-ring-wrap" aria-label={`今日进度 ${value}%`}>
      <svg className="progress-ring" viewBox="0 0 100 100" role="img">
        <circle className="progress-ring-track" cx="50" cy="50" r={radius} />
        <circle className="progress-ring-value" cx="50" cy="50" r={radius} strokeDasharray={`${dash} ${circumference - dash}`} />
      </svg>
      <div className="progress-ring-label"><strong>{value}%</strong><span>今日</span></div>
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('n1-theme', 'light')
  const [progress, setProgress] = useLocalStorage<StoredProgress>('n1-progress', initialProgress)
  const [completedLessons, setCompletedLessons] = useLocalStorage<Record<string, boolean>>('n1-completed-lessons', {})

  const lesson = getLessonByDate(selectedDate)
  const selectedHistoryIndex = historyItems.findIndex((item) => item.date === lesson.date)
  const olderDate = historyItems[selectedHistoryIndex + 1]?.date
  const newerDate = historyItems[selectedHistoryIndex - 1]?.date
  const isLatest = lesson.date === latestLesson.date
  const historyEntry = historyItems.find((item) => item.date === lesson.date)
  const streakDisplay = Math.min(progress.streak, latestLesson.day)

  useEffect(() => {
    setSelectedAnswer(null)
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
    const scheduled = reviewFocusByDate[lesson.date] ?? []
    const vocab = lesson.vocabulary
      .filter((item) => progress.vocab[item.id] === 'review')
      .map((item) => ({ type: '词汇' as const, title: item.word, detail: `${item.reading} · ${item.meaning}` }))
    const grammar = lesson.grammar
      .filter((item) => progress.grammar[item.id] === 'review')
      .map((item) => ({ type: '文法' as const, title: item.pattern, detail: item.meaning }))
    const wrongReading = answered !== undefined && !answerIsCorrect
      ? [{ type: '读解' as const, title: lesson.reading.question.prompt, detail: '重新确认主旨题的证据位置' }]
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
    setProgress((prev) => ({ ...prev, [kind]: { ...prev[kind], [id]: status } }))
  }

  const markImmersionComplete = () => {
    setCompletedLessons((prev) => ({ ...prev, [lesson.date]: !prev[lesson.date] }))
  }

  const submitReading = () => {
    if (selectedAnswer === null) return
    setProgress((prev) => ({ ...prev, readingAnswers: { ...prev.readingAnswers, [lesson.reading.question.id]: selectedAnswer } }))
  }

  return (
    <div className="app" data-theme={theme}>
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="brand" onClick={() => openLesson(latestLesson.date)} role="button" tabIndex={0}>
          <div className="brand-mark">N1</div>
          <div><strong>Immersive</strong><span>Sparring Partner</span></div>
        </div>

        <nav className="side-nav" aria-label="主要导航">
          {navigation.map((item) => (
            <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => go(item.id)}>
              <span className="nav-icon"><Icon name={item.id === 'today' ? 'spark' : item.id === 'history' ? 'history' : item.id === 'reading' ? 'pen' : item.id === 'review' ? 'target' : 'book'} size={18} /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-streak"><Icon name="flame" size={18} /><span><strong>{streakDisplay} 天</strong> 连续学习</span></div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="切换深浅色模式">
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? '深色阅读' : '浅色阅读'}</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen ? <button className="mobile-overlay" aria-label="关闭导航" onClick={() => setMobileNavOpen(false)} /> : null}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="打开导航"><Icon name="menu" /></button>
          <div className="date-switcher">
            <button className="date-nav-btn date-nav-prev" disabled={!olderDate} onClick={() => olderDate && openLesson(olderDate, active)} aria-label="前一天"><Icon name="arrow" size={17} /></button>
            <div className="date-block"><strong>{formatDate(lesson.date)}</strong><span>Day {lesson.day} · 99日N1计划</span></div>
            <button className="date-nav-btn" disabled={!newerDate} onClick={() => newerDate && openLesson(newerDate, active)} aria-label="后一天"><Icon name="arrow" size={17} /></button>
          </div>
          <DailySearch onOpen={openLesson} />
          <div className="topbar-actions">
            <div className="quiet-stat"><Icon name="clock" size={17} /><span>约 {lesson.estimatedMinutes} 分钟</span></div>
            <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="切换阅读主题"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
          </div>
        </header>

        <div className="content-shell">
          {active === 'today' && (
            <div className="page-enter">
              {!isLatest ? (
                <div className={`archive-note ${historyEntry?.merged ? 'merged' : ''}`}>
                  <Icon name="history" size={18} />
                  <span>{historyEntry?.merged ? '历史日报整理版：已把当日原本分开的「N1 沉浸式陪练」与「错题复习」合并到同一页。' : '历史日报：内容已按当前网页的统一格式整理。'}</span>
                </div>
              ) : null}

              <section className="hero">
                <div className="hero-copy">
                  <div className="day-label">{isLatest ? '今日のテーマ' : `DAY ${lesson.day} · ARCHIVE`}</div>
                  <h1>{lesson.title}</h1>
                  <p>{lesson.subtitle}</p>
                  <div className="hero-actions">
                    <button className="primary-btn" onClick={() => go('immersion')}>{isLatest ? '开始今日学习' : '打开这天的学习'} <Icon name="arrow" size={17} /></button>
                    <button className="text-btn" onClick={() => go('review')}>查看当天错题复习</button>
                  </div>
                </div>
                <ProgressRing value={progressValue} />
              </section>

              <section className="summary-strip" aria-label="学习概览">
                <div><span>计划进度</span><strong>{lesson.day}<small> / 99</small></strong></div>
                <div><span>预计学习</span><strong>{lesson.estimatedMinutes}<small> min</small></strong></div>
                <div><span>本日词汇</span><strong>{lesson.vocabulary.length}<small> 个</small></strong></div>
                <div><span>本日文法</span><strong>{lesson.grammar.length}<small> 个</small></strong></div>
              </section>

              <section className="today-plan">
                <SectionHeader eyebrow="TODAY" title="学习路线" description={`按当前统一格式整理，约 ${lesson.estimatedMinutes} 分钟完成；历史日报也保留当日错题复习重点。`} />
                <div className="plan-list">
                  {[
                    ['01', '沉浸阅读', '先只看日文，再切换中日对照与解析。', '8 min', 'immersion' as SectionId],
                    ['02', 'N1 词汇', `${lesson.vocabulary.length} 个当日重点词，带搭配、例句与语感。`, '7 min', 'vocabulary' as SectionId],
                    ['03', 'N1 文法', `${lesson.grammar.length} 个当日重点句型，带接续与相似表达。`, '6 min', 'grammar' as SectionId],
                    ['04', '短文读解', 'JLPT 风格主旨题，提交后逐项确认理由。', '7 min', 'reading' as SectionId],
                    ['05', '错题复习', `${reviewFocusByDate[lesson.date]?.length ?? 0} 个历史错题/薄弱项重点。`, '5 min', 'review' as SectionId],
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
                <div><strong>{isLatest ? '今天的练习重点' : '这天的复习方式'}</strong><p>不要只看中文释义。读完后脱离页面，用自己的日语说明一个词或句型，并在错题复习里确认当日需要间隔复现的薄弱点。</p></div>
              </section>
            </div>
          )}

          {active === 'immersion' && (
            <div className="page-enter reading-page">
              <SectionHeader eyebrow="01" title="沉浸阅读" description="第一遍尽量保持日文模式；遇到不懂的地方先根据上下文推测。" />
              <div className="mode-switch" role="group" aria-label="阅读显示模式">
                {([['japanese', '日本語のみ'], ['bilingual', '日中对照'], ['analysis', '解析']] as [ReadingMode, string][]).map(([mode, label]) => (
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
                    <Icon name="check" size={17} /> {completedLessons[lesson.date] ? '已完成阅读' : '标记为已完成'}
                  </button>
                  <button className="next-link" onClick={() => go('vocabulary')}>下一步：N1 词汇 <Icon name="arrow" size={16} /></button>
                </div>
              </article>
            </div>
          )}

          {active === 'vocabulary' && (
            <div className="page-enter">
              <SectionHeader eyebrow="02" title="N1 词汇" description="历史日报沿用当天重点词；重点记住搭配、语域和例句，不只背中文释义。" />
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
                          <div><span className="detail-label">常见搭配</span><div className="collocations">{item.collocations.map((c) => <span key={c}>{c}</span>)}</div></div>
                          <div><span className="detail-label">语感</span><p>{item.nuance}</p></div>
                        </div>
                        <StatusButton status={status} onChange={(next) => updateStatus('vocab', item.id, next)} />
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="section-next"><button className="primary-btn" onClick={() => go('grammar')}>继续学习文法 <Icon name="arrow" size={17} /></button></div>
            </div>
          )}

          {active === 'grammar' && (
            <div className="page-enter">
              <SectionHeader eyebrow="03" title="N1 文法" description="按当天训练重点整理含义、接续、语体和相似表达。" />
              <div className="learning-list grammar-list">
                {lesson.grammar.map((item, index) => {
                  const status = progress.grammar[item.id] ?? 'new'
                  return (
                    <article className="learning-card" key={item.id}>
                      <div className="card-index">{String(index + 1).padStart(2, '0')}</div>
                      <div className="card-content">
                        <div className="grammar-top"><div><h3>{item.pattern}</h3><p className="meaning">{item.meaning}</p></div><div className="frequency" title="N1 阅读与表达中的实用度"><span>实用度</span><div>{[1,2,3,4,5].map((n) => <i key={n} className={n <= item.frequency ? 'on' : ''} />)}</div></div></div>
                        <div className="grammar-meta"><span><b>接续</b>{item.form}</span><span><b>语体</b>{item.register}</span></div>
                        <p className="grammar-explain">{item.explanation}</p>
                        <div className="example-box"><p>{item.example}</p><span>{item.translation}</span></div>
                        <div className="compare-box"><span>相似表达对比</span><p>{item.comparison}</p></div>
                        <StatusButton status={status} onChange={(next) => updateStatus('grammar', item.id, next)} />
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="section-next"><button className="primary-btn" onClick={() => go('reading')}>进入读解练习 <Icon name="arrow" size={17} /></button></div>
            </div>
          )}

          {active === 'reading' && (
            <div className="page-enter reading-page">
              <SectionHeader eyebrow="04" title="短文读解" description="先找作者的主张、条件和转折，再选择答案。" />
              <article className="reading-paper quiz-paper">
                <div className="article-head"><span>JLPT N1 · 読解 · DAY {lesson.day}</span><h1>{lesson.reading.title}</h1></div>
                {lesson.reading.paragraphs.map((p, index) => <p className="jp-body" key={`${lesson.date}-reading-${index}`}>{p}</p>)}
                <div className="question-block">
                  <div className="question-label">問題 1</div>
                  <h3>{lesson.reading.question.prompt}</h3>
                  <div className="answers">
                    {lesson.reading.question.options.map((option, index) => {
                      const submitted = answered !== undefined
                      const isCorrect = index === lesson.reading.question.answer
                      const isChosen = (submitted ? answered : selectedAnswer) === index
                      const classes = ['answer-option', isChosen ? 'selected' : '', submitted && isCorrect ? 'correct' : '', submitted && isChosen && !isCorrect ? 'wrong' : ''].filter(Boolean).join(' ')
                      return (
                        <button key={option} className={classes} onClick={() => !submitted && setSelectedAnswer(index)} disabled={submitted}>
                          <span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
                        </button>
                      )
                    })}
                  </div>
                  {answered === undefined ? (
                    <button className="primary-btn submit-answer" onClick={submitReading} disabled={selectedAnswer === null}>提交答案</button>
                  ) : (
                    <div className={`result-panel ${answerIsCorrect ? 'success' : 'error'}`}>
                      <div className="result-title"><Icon name={answerIsCorrect ? 'check' : 'target'} size={19} /><strong>{answerIsCorrect ? '回答正确' : `正确答案：${String.fromCharCode(65 + lesson.reading.question.answer)}`}</strong></div>
                      <p>{lesson.reading.question.explanation}</p>
                      <div className="option-notes">{lesson.reading.question.optionNotes.map((note, index) => <p key={`${lesson.date}-note-${index}`}><b>{String.fromCharCode(65 + index)}</b>{note}</p>)}</div>
                    </div>
                  )}
                </div>
              </article>
            </div>
          )}

          {active === 'review' && (
            <div className="page-enter">
              <SectionHeader eyebrow="REVIEW" title="错题与薄弱项复习" description="历史日期会显示当时单独推送过的错题复习重点；你后来手动标记的项目也会继续追加在这里。" />
              {reviewItems.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><Icon name="check" size={26} /></div><h3>这天没有待复习项目</h3><p>在词汇或文法卡片里点“需要复习”，或完成一次读解答题后，这里会自动汇总。</p><button className="text-btn" onClick={() => go('vocabulary')}>去做学习</button></div>
              ) : (
                <div className="review-list">
                  {reviewItems.map((item, index) => <div className="review-row" key={`${item.type}-${item.title}-${index}`}><span className="review-number">{index + 1}</span><span className="review-type">{item.type}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><Icon name="arrow" size={17} /></div>)}
                </div>
              )}
              <section className="spaced-review">
                <div><span className="section-index">SPACED REVIEW</span><h3>推荐复习节奏</h3><p>旧错题已按当日内容合并；掌握后仍建议在间隔中主动回忆，而不是反复重读。</p></div>
                <div className="intervals"><span>1 天</span><i /><span>3 天</span><i /><span>7 天</span><i /><span>14 天</span><i /><span>30 天</span></div>
              </section>
            </div>
          )}

          {active === 'history' && (
            <div className="page-enter">
              <SectionHeader eyebrow="HISTORY" title="N1 沉浸式陪练历史日报" description="已收录从 2026-08-30 Day 1 起的日报。早期分开的陪练与错题复习已经合并为同一天的一份内容。" />
              <section className="history-summary">
                <div><span>当前计划</span><strong>{latestLesson.day}<small> / 99</small></strong></div>
                <div><span>已收录日报</span><strong>{historyItems.length}<small> 天</small></strong></div>
                <div><span>旧推送已合并</span><strong>{historyItems.filter((item) => item.merged).length}<small> 天</small></strong></div>
              </section>
              <div className="history-table-wrap">
                <div className="history-head"><span>日期</span><span>主题</span><span>用时</span><span>状态</span></div>
                {historyItems.map((item) => {
                  const current = item.date === lesson.date
                  const latest = item.date === latestLesson.date
                  return (
                    <button className={`history-row history-row-button ${current ? 'selected' : ''}`} key={item.date} onClick={() => openLesson(item.date)}>
                      <span><b>{item.date.slice(5).replace('-', '/')}</b><small>Day {item.day}</small></span>
                      <span className="history-title">{item.title}</span>
                      <span>{item.minutes} min</span>
                      <span className={`history-status ${item.merged ? 'merged' : ''}`}>{latest ? '今天' : item.merged ? '历史合并' : '已收录'}</span>
                    </button>
                  )
                })}
              </div>
              <div className="history-note"><Icon name="layers" size={20} /><p>8/30～9/4 期间原本分开的「N1 沉浸式陪练」与「错题复习」已经按日期合并。之后的日报也使用同一数据结构，所以切换任意日期都能继续查看沉浸阅读、词汇、文法、读解和当日错题。</p></div>
            </div>
          )}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="移动端快捷导航">
        {navigation.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.short}</span></button>)}
      </nav>
    </div>
  )
}
