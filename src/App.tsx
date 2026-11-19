import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProjectSearch } from './components/ProjectSearch'
import { SearchHighlight } from './components/SearchHighlight'
import { AudioButton, SentenceAudio } from './components/AudioButton'
import { AudioAvailability } from './components/AudioAvailability'
import { stopAudio } from './lib/audioPlayer'
import type { ProjectSearchResult, LiveSearchResult, LessonSearchResult } from './lib/projectSearch'
import { DateDropdown } from './components/DateDropdown'
import { historyItems, lesson as latestLesson } from './data/history'
import { useLesson } from './hooks/useLesson'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { LearningStatus, ReadingMode, SectionId, StoredProgress } from './types'
import { ReadingExercise } from './components/ReadingExercise'
import { PracticeExercises, practiceCategoryLabels } from './components/PracticeExercises'
import { getPracticeQuestions, getAllLessonQuestions } from './lib/practice'
import { questionReview, questionElementId, practiceHref, parsePracticeHash } from './lib/questionReview'
import type { PracticeCategory } from './types'
import { initialProgress, decodeProgress, decodeCompleted, decodeTheme, recordStudy, streakFor, tokyoDate } from './lib/progress'
import './history.css'
import './study-reference.css'
import './compound-verbs.css'
import './practice.css'
import { compoundSeriesFromHash, getCompoundSeriesForWord } from './lib/compoundVerbs'
import type { CompoundVocabularyOrigin } from './components/CompoundVerbs'
import { StudyReference, ReviewEvidence } from './components/StudyReference'

const CompoundVerbs = lazy(() => import('./components/CompoundVerbs'))
const LiveReactions = lazy(() => import('./components/LiveReactions'))
const ProgressBackup = lazy(() => import('./components/ProgressBackup'))

const navigation: { id: SectionId; label: string; short: string }[] = [
  { id: 'today', label: '今日の学習', short: '今日' },
  { id: 'immersion', label: '没入読解', short: '没入' },
  { id: 'vocabulary', label: 'N1 語彙', short: '語彙' },
  { id: 'compound-verbs', label: '複合動詞', short: '複合' },
  { id: 'grammar', label: 'N1 文法', short: '文法' },
  { id: 'reading', label: '読解練習', short: '読解' },
  { id: 'review', label: '誤答復習', short: '復習' },
  { id: 'live-reactions', label: '直播条反', short: '条反' },
  { id: 'history', label: '学習履歴', short: '履歴' },
]

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
    live: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="m10 8 5 3-5 3V8ZM8 21h8M12 17v4"/></>,
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

function scrollPageStart() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
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
  const [initialQuestionTarget] = useState(() => {
    const target = parsePracticeHash(window.location.hash)
    return target && historyItems.some(item => item.date === target.date) ? { date: target.date, category: target.category, questionId: target.id } : null
  })
  const [questionTarget, setQuestionTarget] = useState(() => initialQuestionTarget ? { ...initialQuestionTarget, token: 0, retry: false } : null)
  const [questionLinkError, setQuestionLinkError] = useState(false)
  const [legacyReadingOpen, setLegacyReadingOpen] = useState(false)
  const [active, setActive] = useState<SectionId>(() => initialQuestionTarget?.category ?? (compoundSeriesFromHash(window.location.hash) ? 'compound-verbs' : window.location.hash === '#live-reactions' ? 'live-reactions' : 'today'))
  const [compoundSeriesId, setCompoundSeriesId] = useState(() => compoundSeriesFromHash(window.location.hash) ?? 'au')
  const [compoundOrigin, setCompoundOrigin] = useState<CompoundVocabularyOrigin | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentQuery, setContentQuery] = useState('')
  const [searchComposing, setSearchComposing] = useState(false)
  const [searchLocated, setSearchLocated] = useState(0)
  const [searchSelection, setSearchSelection] = useState(0)
  const [searchStep, setSearchStep] = useState({ id: 0, direction: 1 })
  const [liveSearchTarget, setLiveSearchTarget] = useState<(LiveSearchResult & { token: number }) | null>(null)
  const locatedLessonRef = useRef<LessonSearchResult | null>(null)
  const [lessonSearchTarget, setLessonSearchTarget] = useState<(LessonSearchResult & { query: string }) | null>(null)
  const changeSearch = (query: string, composing = false) => {
    setSearchQuery(query)
    setSearchComposing(composing)
    if (!composing) {
      setContentQuery(query)
      if (lessonSearchTarget && query !== lessonSearchTarget.query) setLessonSearchTarget(null)
    }
  }
  const [returnVocabularyId, setReturnVocabularyId] = useState<string | null>(null)
  const [returnCardTarget, setReturnCardTarget] = useState<{ section: SectionId; id: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState(initialQuestionTarget?.date ?? latestLesson.date)
  const [readingMode, setReadingMode] = useState<ReadingMode>('japanese')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme, themeStorage] = useLocalStorage('n1-theme', 'light', decodeTheme)
  const [progress, setProgress, progressStorage] = useLocalStorage<StoredProgress>('n1-progress', initialProgress, decodeProgress)
  const [completedLessons, setCompletedLessons, completedStorage] = useLocalStorage<Record<string, boolean>>('n1-completed-lessons', {}, decodeCompleted)
  const storageStates = [themeStorage, progressStorage, completedStorage]
  const [today, setToday] = useState(tokyoDate)
  const { payload: { lesson, reviewFocus }, loading: lessonLoading, failed: lessonFailed, retry: retryLesson } = useLesson(selectedDate)
  const lessonUnavailable = (lessonLoading || lessonFailed) && !['compound-verbs', 'live-reactions', 'history'].includes(active)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (active === 'compound-verbs') url.hash = `compound-verbs/${compoundSeriesId}`
    else if (active === 'live-reactions') url.hash = 'live-reactions'
    else if (url.hash === '#live-reactions' || url.hash.startsWith('#compound-verbs') || (url.hash.startsWith('#practice/') && !questionTarget)) url.hash = ''
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
  }, [active, compoundSeriesId, questionTarget])
  useEffect(() => {
    const onHashChange = () => {
      setLiveSearchTarget(null)
      setLessonSearchTarget(null)
      const question = parsePracticeHash(window.location.hash)
      if (question) {
        if (!historyItems.some(item => item.date === question.date)) { setQuestionLinkError(true); return }
        setQuestionTarget(previous => ({ date: question.date, category: question.category, questionId: question.id, token: (previous?.token ?? 0) + 1, retry: false }))
        setQuestionLinkError(false)
        setSelectedDate(question.date)
        setActive(question.category)
        return
      }
      setQuestionTarget(null)
      const id = compoundSeriesFromHash(window.location.hash)
      if (id) { setCompoundSeriesId(id); setCompoundOrigin(null); setActive('compound-verbs') }
      else if (window.location.hash === '#live-reactions') setActive('live-reactions')
      else setActive(section => section === 'compound-verbs' || section === 'live-reactions' ? 'today' : section)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  useEffect(() => {
    if (!questionTarget || lessonLoading || lessonFailed || lesson.date !== questionTarget.date || active !== questionTarget.category) return
    const found = getAllLessonQuestions(lesson).find(item => item.question.id === questionTarget.questionId && item.category === questionTarget.category)
    if (!found) { setQuestionLinkError(true); return }
    setQuestionLinkError(false)
    const legacy = found.question.id === lesson.reading.question.id
    if (legacy && lesson.practice && !legacyReadingOpen) { setLegacyReadingOpen(true); return }
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(legacy ? 'reading-question' : questionElementId(found.question.id))
      element?.scrollIntoView({ block: 'start', behavior: 'instant' })
      element?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [questionTarget, lesson, lessonLoading, lessonFailed, active, legacyReadingOpen])
  useEffect(() => {
    if (active !== 'vocabulary' || !returnVocabularyId || lessonLoading || lessonFailed) return
    const frame = window.requestAnimationFrame(() => {
      const card = document.getElementById(`vocabulary-${returnVocabularyId}`)
      card?.scrollIntoView({ block: 'start', behavior: 'instant' })
      card?.focus({ preventScroll: true })
      setReturnVocabularyId(null)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [active, returnVocabularyId, lessonLoading, lessonFailed])
  useEffect(() => {
    if (!returnCardTarget || active !== returnCardTarget.section || lessonLoading || lessonFailed) return
    const frame = window.requestAnimationFrame(() => {
      const card = document.getElementById(`${returnCardTarget.section}-${returnCardTarget.id}`)
      card?.scrollIntoView({ block: 'start', behavior: 'instant' }); card?.focus({ preventScroll: true })
      setReturnCardTarget(null)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [active, returnCardTarget, lessonLoading, lessonFailed])
  useEffect(() => {
    const refresh = () => setToday(tokyoDate())
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])

  useEffect(() => { stopAudio() }, [active, selectedDate, lesson.date, compoundSeriesId])
  const isLatest = lesson.date === latestLesson.date
  const historyEntry = historyItems.find((item) => item.date === lesson.date)
  const streakDisplay = streakFor(progress.studyDates, today)

  useEffect(() => {
    setReadingMode(lessonSearchTarget?.date === lesson.date ? lessonSearchTarget.readingMode ?? 'japanese' : 'japanese')
  }, [lesson.date])

  const lessonHighlightQuery = lessonSearchTarget?.date === lesson.date && lessonSearchTarget.section === active && contentQuery === lessonSearchTarget.query ? contentQuery : ''
  const highlight = (text: string) => <SearchHighlight text={text} query={lessonHighlightQuery} className="search-hit lesson-search-hit" />
  useEffect(() => {
    if (!lessonSearchTarget || searchComposing || !lessonHighlightQuery || locatedLessonRef.current === lessonSearchTarget) return
    const frame = window.requestAnimationFrame(() => {
      const section = document.getElementById(lessonSearchTarget.anchor)
      if (!section) return
      document.querySelectorAll('.lesson-search-hit.is-current').forEach(hit => { hit.classList.remove('is-current'); hit.removeAttribute('aria-current') })
      const scope = lessonSearchTarget.readingMode === 'analysis' ? section.querySelector('.analysis-note') : lessonSearchTarget.readingMode === 'bilingual' ? section.querySelector('.zh-translation') : section
      if (!scope) return
      locatedLessonRef.current = lessonSearchTarget
      const hit = scope.querySelector<HTMLElement>('mark.lesson-search-hit')
      const target = hit ?? section
      if (hit) { hit.classList.add('is-current'); hit.setAttribute('aria-current', 'true') }
      // Skip the ordinary section-opening scroll-to-top and position the actual
      // match after React has rendered the selected lesson and reading mode.
      target.scrollIntoView({ block: hit ? 'center' : 'start', behavior: 'instant' })
      const top = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
      const nav = document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect()
      const bottom = nav && nav.height > 0 ? nav.top : window.innerHeight
      const rect = target.getBoundingClientRect()
      if (rect.top < top + 12 || rect.bottom > bottom - 12) {
        window.scrollBy({ top: rect.top - (top + 16), behavior: 'instant' })
      }
      section.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [lessonSearchTarget, lessonHighlightQuery, searchComposing, readingMode])

  const answered = progress.readingAnswers[lesson.reading.question.id]
  const practiceQuestions = useMemo(() => getPracticeQuestions(lesson), [lesson])
  const practiceCount = (category: PracticeCategory) => practiceQuestions.filter(item => item.category === category).length

  const progressValue = useMemo(() => {
    const vocabDone = lesson.vocabulary.filter((item) => progress.vocab[item.id] === 'mastered').length
    const grammarDone = lesson.grammar.filter((item) => progress.grammar[item.id] === 'mastered').length
    const readingDone = practiceQuestions.filter(({ question }) => progress.readingAnswers[question.id] !== undefined).length
    const immersionDone = completedLessons[lesson.date] ? 1 : 0
    const total = lesson.vocabulary.length + lesson.grammar.length + practiceQuestions.length + 1
    return Math.round(((vocabDone + grammarDone + readingDone + immersionDone) / total) * 100)
  }, [practiceQuestions, completedLessons, lesson, progress])

  const reviewItems = useMemo(() => {
    return getAllLessonQuestions(lesson).flatMap(item => {
      const state = questionReview(item.question, progress, today)
      return state ? [{ ...item, state }] : []
    })
  }, [lesson, progress, today])

  const manualReviewItems = useMemo(() => {
    const vocab = lesson.vocabulary
      .filter((item) => progress.vocab[item.id] === 'review')
      .map((item) => ({ id: item.id, type: '語彙', section: 'vocabulary' as SectionId, title: item.word, detail: `${item.reading} · ${item.meaning}` }))
    const grammar = lesson.grammar
      .filter((item) => progress.grammar[item.id] === 'review')
      .map((item) => ({ id: item.id, type: '文法', section: 'grammar' as SectionId, title: item.pattern, detail: item.meaning }))
    return [...vocab, ...grammar]
  }, [lesson, progress])

  const go = (section: SectionId) => {
    setQuestionTarget(null)
    setQuestionLinkError(false)
    setLessonSearchTarget(null)
    setLiveSearchTarget(null)
    setActive(section)
    setMobileNavOpen(false)
    scrollPageStart()
  }

  const openCompoundSeries = (item: {id: string; word: string}) => {
    const series = getCompoundSeriesForWord(item.word)[0]
    if (!series) return
    changeSearch('')
    setCompoundSeriesId(series.id)
    setCompoundOrigin({ date: lesson.date, id: item.id, word: item.word })
    go('compound-verbs')
  }

  const returnToVocabulary = () => {
    if (!compoundOrigin) return
    setSelectedDate(compoundOrigin.date)
    setReturnVocabularyId(compoundOrigin.id)
    setActive('vocabulary')
    setMobileNavOpen(false)
  }

  const openLesson = (date: string, section: SectionId = 'today') => {
    setQuestionTarget(null)
    setQuestionLinkError(false)
    setLegacyReadingOpen(false)
    setLessonSearchTarget(null)
    setLiveSearchTarget(null)
    setSelectedDate(date)
    setActive(section)
    setMobileNavOpen(false)
    scrollPageStart()
  }

  const openSearchResult = (result: ProjectSearchResult) => {
    setQuestionTarget(null)
    setQuestionLinkError(false)
    if (result.kind === 'lesson') {
      setLegacyReadingOpen(result.section === 'reading' && result.anchor.startsWith('reading-'))
      setLiveSearchTarget(null)
      setReturnVocabularyId(null)
      setLessonSearchTarget({ ...result, query: contentQuery })
      setSelectedDate(result.date)
      setReadingMode(result.readingMode ?? 'japanese')
      setActive(result.section)
      setMobileNavOpen(false)
    } else if (result.kind === 'compound') {
      setLessonSearchTarget(null)
      setLiveSearchTarget(null)
      setCompoundSeriesId(result.seriesId)
      setCompoundOrigin(null)
      setSearchSelection(count => count + 1)
      setActive('compound-verbs')
      setMobileNavOpen(false)
    } else {
      setLessonSearchTarget(null)
      setSearchSelection(count => count + 1)
      setLiveSearchTarget({ ...result, token: searchSelection + 1 })
      setActive('live-reactions')
      setMobileNavOpen(false)
    }
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

  const submitQuestion = (id: string, answer: number) => {
    if (!getAllLessonQuestions(lesson).some(item => item.question.id === id) || !Number.isInteger(answer) || answer < 0 || answer > 3) return
    const at = new Date().toISOString()
    setProgress(prev => recordStudy({ ...prev,
      readingAnswers: { ...prev.readingAnswers, [id]: answer },
      readingAttempts: { ...prev.readingAttempts, [id]: [...(prev.readingAttempts[id] ?? []), { answer, at }] },
    }))
    setToday(tokyoDate())
  }

  const openQuestion = (category: PracticeCategory, questionId: string, retry = false) => {
    setLessonSearchTarget(null)
    setLiveSearchTarget(null)
    setQuestionLinkError(false)
    setQuestionTarget(previous => ({ date: lesson.date, category, questionId, token: (previous?.token ?? 0) + 1, retry }))
    setActive(category)
    setMobileNavOpen(false)
    const url = new URL(window.location.href)
    url.hash = practiceHref(lesson.date, category, questionId)
    window.history.pushState(window.history.state, '', url)
  }

  const practiceNavigation = lesson.practice ? <nav className="practice-category-nav" aria-label="練習の分類">
    {(['vocabulary', 'grammar', 'reading'] as PracticeCategory[]).map(category => <button key={category} aria-current={active === category ? 'page' : undefined} onClick={() => go(category)}>
      {practiceCategoryLabels[category]}<small>{practiceCount(category)}問</small>
    </button>)}
  </nav> : null
  const practiceSection = (category: PracticeCategory) => <PracticeExercises lesson={lesson} category={category} progress={progress}
    onSubmit={submitQuestion} searchQuery={lessonHighlightQuery}
    retryTarget={questionTarget?.retry ? questionTarget : null} />

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
            <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} aria-current={active === item.id ? 'page' : undefined} onClick={() => go(item.id)}>
              <span className="nav-icon"><Icon name={item.id === 'compound-verbs' ? 'layers' : item.id === 'live-reactions' ? 'live' : item.id === 'today' ? 'spark' : item.id === 'history' ? 'history' : item.id === 'reading' ? 'pen' : item.id === 'review' ? 'target' : 'book'} size={18} /></span>
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
        <p className="audio-credit">音声：AivisSpeech / morioki（ノーマル）</p>
      </aside>

      {mobileNavOpen ? <button className="mobile-overlay" aria-label="ナビゲーションを閉じる" onClick={() => setMobileNavOpen(false)} /> : null}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="ナビゲーションを開く"><Icon name="menu" /></button>
          {active === 'compound-verbs' ? <div className="compound-topbar-label"><strong>複合動詞</strong><small>構造と意味から広げる</small></div> : active === 'live-reactions' ? <div className="live-topbar-label"><strong>直播条反</strong><small>独立知识库 · 日中对照</small></div> : <DateDropdown date={selectedDate} day={historyItems.find(item => item.date === selectedDate)?.day ?? lesson.day} activeSection={active} onOpen={openLesson} />}
          <ProjectSearch query={searchQuery} contentQuery={contentQuery} onChange={changeSearch} onOpen={openSearchResult} located={searchLocated}
            onNavigateMatches={active === 'compound-verbs' ? direction => setSearchStep(step => ({ id: step.id + 1, direction })) : undefined} />
          <div className="topbar-actions">
            <div className="quiet-stat"><Icon name={active === 'live-reactions' || active === 'compound-verbs' ? 'book' : 'clock'} size={17} /><span>{active === 'compound-verbs' ? '語彙を広げる' : active === 'live-reactions' ? '直播笔记' : `約 ${lesson.estimatedMinutes} 分`}</span></div>
            <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="読解テーマを切り替える"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
          </div>
        </header>

        <div className="content-shell">
          {questionLinkError ? <p className="storage-notice" role="alert">指定された問題はこの教材に見つかりませんでした。分類から問題を選び直してください。学習記録は変更していません。</p> : null}
          {active !== 'live-reactions' ? <AudioAvailability /> : null}
          {lessonUnavailable ? lessonFailed ? <div className="storage-notice" role="alert"><p>この日の教材を読み込めませんでした。学習記録は保持されています。</p><button className="text-btn" onClick={retryLesson}>教材を再読み込み</button></div>
            : <p className="lesson-loading" role="status">この日の教材を読み込んでいます…</p> : null}
          {storageStates.some(state => state.failed) ? <div className="storage-notice" role="alert">
            <p>このブラウザーに学習記録を保存できません。学習は続けられますが、ページを閉じると今回の変更が失われる可能性があります。</p>
            <button className="text-btn" onClick={() => storageStates.forEach(state => state.retry())}>保存を再試行</button>
          </div> : storageStates.some(state => state.recovered) ? <div className="storage-notice" role="status">
            <p>保存データの一部を読み込めなかったため、その部分を初期状態に戻しました。読み込めた学習記録は保持しています。</p>
            <button className="text-btn" onClick={() => storageStates.forEach(state => state.dismiss())}>閉じる</button>
          </div> : null}
          {active === 'compound-verbs' && <Suspense fallback={<p role="status">複合動詞を読み込んでいます…</p>}><CompoundVerbs selectedId={compoundSeriesId} onSelect={setCompoundSeriesId} origin={compoundOrigin} onReturn={returnToVocabulary}
            query={contentQuery} composing={searchComposing} onClear={() => changeSearch('')}
            selectionToken={searchSelection} step={searchStep} onLocated={() => setSearchLocated(count => count + 1)} /></Suspense>}
          {active === 'live-reactions' && <Suspense fallback={<p role="status">正在加载直播笔记…</p>}><LiveReactions query={contentQuery} composing={searchComposing} onClear={() => changeSearch('')} searchTarget={liveSearchTarget} onTargetLocated={() => setLiveSearchTarget(null)} /></Suspense>}
          {!lessonUnavailable && <>
          {active === 'today' && (
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
                <div><span>学習時間の目安</span><strong>{lesson.estimatedMinutes}<small> min</small></strong></div>
                <div><span>この日の語彙</span><strong>{lesson.vocabulary.length}<small> 項目</small></strong></div>
                <div><span>この日の文法</span><strong>{lesson.grammar.length}<small> 項目</small></strong></div>
              </section>

              <section className="today-plan">
                <SectionHeader eyebrow="TODAY" title="学習の進め方" description={`全体の学習時間は約 ${lesson.estimatedMinutes} 分。以下から各教材・練習へ進めます。`} />
                {practiceNavigation}
                {lesson.practice && <p className="practice-help">今回の{practiceQuestions.length}問は既存のJLPT演習100分のうち{lesson.practice.estimatedMinutes}分（語彙7分・文法8分・読解40分）で行います。聴解45分を残し、一日の総学習時間は増やしません。</p>}
                <div className="plan-list">
                  {[
                    ['01', '没入読解', 'まず日本語で読み、必要に応じて対訳や解説を確認しましょう。', '8 min', 'immersion' as SectionId],
                    ['02', 'N1 語彙', lesson.practice ? `語彙問題${practiceCount('vocabulary')}問。学習カード${lesson.vocabulary.length}語は別に確認できます。` : `${lesson.vocabulary.length}語の重点語彙を、組み合わせ・例文・ニュアンスとともに学びます。`, '7 min', 'vocabulary' as SectionId],
                    ['03', 'N1 文法', lesson.practice ? `文法問題${practiceCount('grammar')}問。文法形式・文の組み立て・文章の文法を練習します。` : `${lesson.grammar.length}項目の重点文型を、接続や類似表現とともに学びます。`, lesson.practice ? '8 min' : '6 min', 'grammar' as SectionId],
                    ['04', '読解練習', lesson.practice ? `短文・中篇・長文・比較・情報検索の${practiceCount('reading')}問。各選択肢の根拠は回答後に確認します。` : '主旨を問う読解問題です。回答後に各選択肢の根拠を確認します。', lesson.practice ? '40 min' : '7 min', 'reading' as SectionId],
                    ['05', '誤答復習', `この日に実際に間違えた${reviewItems.length}問。クリックして元の問題へ戻ります。`, '5 min', 'review' as SectionId],
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
                <div className="article-head" id="immersion-title" tabIndex={-1}><span>N1 IMMERSION · DAY {lesson.day}</span><div className="audio-heading"><h1>{highlight(lesson.immersion.title)}</h1><AudioButton text={lesson.immersion.title} /></div></div>
                {lesson.immersion.paragraphs.map((p, index) => (
                  <div className="paragraph-block" id={`immersion-paragraph-${index}`} tabIndex={-1} key={`${lesson.date}-${index}`}>
                    <p className="jp-body"><SentenceAudio text={p} renderText={highlight} /></p>
                    {readingMode === 'bilingual' ? <p className="zh-translation">{highlight(lesson.immersion.translations[index])}</p> : null}
                    {readingMode === 'analysis' ? <div className="analysis-note"><span>POINT {index + 1}</span><p>{highlight(lesson.immersion.analysis[index])}</p></div> : null}
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
              {practiceNavigation}
              {practiceSection('vocabulary')}
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
          )}

          {active === 'grammar' && (
            <div className="page-enter">
              <SectionHeader eyebrow="03" title="N1 文法" description="意味・接続・文体を確認し、似た表現との違いを整理しましょう。" />
              {practiceNavigation}
              {practiceSection('grammar')}
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
          )}

          {active === 'reading' && (
            <div className="page-enter reading-page">
              <SectionHeader eyebrow="04" title={lesson.practice ? '読解練習' : '短文読解'} description="筆者の主張・条件・逆接を確認してから、答えを選びましょう。" />
              {practiceNavigation}
              {practiceSection('reading')}
              <details className={lesson.practice ? 'legacy-reading' : 'legacy-reading-default'} open={!lesson.practice || legacyReadingOpen} onToggle={event => {
                if (lesson.practice) setLegacyReadingOpen(event.currentTarget.open)
              }}>
              <summary hidden={!lesson.practice}>以前の主旨問題・回答履歴（今回の読解問題数には含めません）</summary>
              <article className="reading-paper quiz-paper">
                <div className="article-head" id="reading-title" tabIndex={-1}><span>JLPT N1 · 読解 · DAY {lesson.day}</span><div className="audio-heading"><h1>{highlight(lesson.reading.title)}</h1><AudioButton text={lesson.reading.title} /></div></div>
                {lesson.reading.paragraphs.map((p, index) => <p className="jp-body" id={`reading-paragraph-${index}`} tabIndex={-1} key={`${lesson.date}-reading-${index}`}><SentenceAudio text={p} renderText={highlight} /></p>)}
                <ReadingExercise key={`${lesson.reading.question.id}:${questionTarget?.questionId === lesson.reading.question.id ? questionTarget.token : 0}`} question={lesson.reading.question}
                  day={lesson.day} answered={answered} attempts={progress.readingAttempts[lesson.reading.question.id] ?? []}
                  onSubmit={answer => submitQuestion(lesson.reading.question.id, answer)} searchQuery={lessonHighlightQuery}
                  startRetry={questionTarget?.questionId === lesson.reading.question.id && questionTarget.retry} />
              </article>
              </details>
            </div>
          )}

          {active === 'review' && (
            <div className="page-enter">
              <SectionHeader eyebrow="REVIEW" title="この日の実際の誤答" description="提出した回答で一度でも間違えた問題だけを表示します。未回答・初回から正解の問題は入りません。" />
              <p className="review-counts">Day {lesson.day} · {lesson.date} · 誤答した問題 {reviewItems.length}問 · 本日までの復習対象 {reviewItems.filter(item => item.state.due).length}問</p>
              {reviewItems.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><Icon name="check" size={26} /></div><h3>この日の誤答記録はありません</h3><p>語彙・文法・読解で回答を提出し、間違えた問題だけが追加されます。まだ解いていない問題を習得済みとは判定しません。</p><button className="text-btn" onClick={() => go(lesson.practice ? 'vocabulary' : 'reading')}>問題を解く</button></div>
              ) : (
                <div className="review-list">
                  {(['vocabulary', 'grammar', 'reading'] as PracticeCategory[]).map(category => {
                    const items = reviewItems.filter(item => item.category === category)
                    return items.length ? <section key={category} aria-label={`${practiceCategoryLabels[category]}の誤答`}>
                      <h3 className="review-category-heading">{practiceCategoryLabels[category]} · {items.length}問</h3>
                      {items.map((item, index) => <div className="review-row" data-review-question={item.question.id} data-due={item.state.due} key={item.question.id}>
                        <span className="review-number">{index + 1}</span><span className="review-type">{category === 'vocabulary' ? '語彙' : category === 'grammar' ? '文法' : '読解'}</span>
                        <div><strong>{item.question.prompt}</strong>
                          <p>{item.group?.title ?? '以前の主旨問題'} · {item.state.streak < 2 ? `連続正解 ${item.state.streak}/2 · 引き続き復習` : `連続正解 ${item.state.streak}回 · 復習間隔を延長`}</p>
                          <p>{item.state.dueDate ? `${item.state.due ? '復習日' : '次の復習'}：${item.state.dueDate}` : '回答日時不明 · 復習待ち'} · {item.state.intervalDays}日間隔</p>
                        </div>
                        <a className="review-question-link" href={practiceHref(lesson.date, category, item.question.id)} aria-label={`${item.question.prompt}を復習する`} onClick={event => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                          event.preventDefault(); openQuestion(category, item.question.id, true)
                        }}>元の問題で復習する →</a>
                      </div>)}
                    </section> : null
                  })}
                </div>
              )}
              <section className="spaced-review">
                <div><span className="section-index">SPACED REVIEW</span><h3>実際の回答に合わせて復習</h3><p>誤答後は翌日から復習。実際に2回正解するまでは頻度を下げず、その後3・7・14日間隔へ進みます。再び間違えたら翌日から再開し、以前の履歴も残します。</p></div>
                <div className="intervals"><span>1 日</span><i /><span>3 日</span><i /><span>7 日</span><i /><span>14 日</span></div>
              </section>
              {manualReviewItems.length > 0 && <section className="manual-review-section" aria-label="自分でマークした学習カード">
                <h3>自分でマークした学習カード</h3><p>「要復習」にしたカードです。問題の誤答件数には含めません。</p>
                {manualReviewItems.map(item => <div className="manual-review-row" key={item.id}>
                  <span className="tag">{item.type}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div>
                  <button className="text-btn" onClick={() => { go(item.section); setReturnCardTarget({ section: item.section, id: item.id }) }}>カードを見る</button>
                </div>)}
              </section>}
            </div>
          )}

          </>}
          {active === 'history' && (
            <div className="page-enter">
              <SectionHeader eyebrow="HISTORY" title="N1 学習アーカイブ" description="2026年8月30日（Day 1）からの教材を収録しています。日付を選んで学習を再開できます。" />
              <section className="history-summary">
                <div><span>現在の計画</span><strong>{latestLesson.day}<small> / 99</small></strong></div>
                <div><span>収録教材</span><strong>{historyItems.length}<small> 日</small></strong></div>
                <div><span>復習を統合した教材</span><strong>{historyItems.filter((item) => item.merged).length}<small> 日</small></strong></div>
              </section>
              <Suspense fallback={<p role="status">学習記録を読み込んでいます…</p>}><ProgressBackup /></Suspense>
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
        {navigation.filter(item => ['today', 'immersion', 'vocabulary', 'grammar', 'reading'].includes(item.id)).map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.short}</span></button>)}
      </nav>
    </div>
  )
}
