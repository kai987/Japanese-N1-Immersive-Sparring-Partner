import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ProjectSearch } from './components/ProjectSearch'
import { SearchHighlight } from './components/SearchHighlight'
import { AudioAvailability } from './components/AudioAvailability'
import { stopAudio } from './lib/audioPlayer'
import type { ProjectSearchResult, LiveSearchResult, LessonSearchResult } from './lib/projectSearch'
import { DateDropdown } from './components/DateDropdown'
import { historyItems, lesson as latestLesson } from './data/history'
import { useLesson } from './hooks/useLesson'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { LearningStatus, ReadingMode, SectionId, StoredProgress } from './types'
import { PracticeExercises, practiceCategoryLabels } from './components/PracticeExercises'
import { getPracticeQuestions, getAllLessonQuestions } from './lib/practice'
import { questionElementId, practiceHref } from './lib/questionReview'
import { getLessonReviewItems } from './lib/lessonReview'
import type { PracticeCategory } from './types'
import { initialProgress, decodeProgress, decodeCompleted, decodeTheme, recordStudy, streakFor, tokyoDate } from './lib/progress'
import './history.css'
import './study-reference.css'
import './compound-verbs.css'
import './learning-cards.css'
import './practice.css'
import { getCompoundSeriesForWord } from './lib/compoundCatalog'
import type { CompoundVocabularyOrigin } from './components/CompoundVerbs'
import { Icon } from './components/StudyUI'
import { ResourceBoundary } from './components/ResourceBoundary'
import { AudioScope } from './components/AudioScope'
import { reloadWithSearch } from './lib/resourceRecovery'
import { useAppNavigation } from './hooks/useAppNavigation'
import { TodayPage } from './pages/TodayPage'
import { ImmersionPage } from './pages/ImmersionPage'
import { VocabularyPage } from './pages/VocabularyPage'
import { GrammarPage } from './pages/GrammarPage'
import { ReadingPage } from './pages/ReadingPage'
import { ReviewPage } from './pages/ReviewPage'
import { HistoryPage } from './pages/HistoryPage'

const CompoundVerbs = lazy(() => import('./components/CompoundVerbs'))
const LiveReactions = lazy(() => import('./components/LiveReactions'))

const navigation: { id: SectionId; label: string; short: string }[] = [
  { id: 'today', label: '今日の学習', short: '今日' },
  { id: 'immersion', label: '没入読解', short: '没入' },
  { id: 'vocabulary', label: 'N1 語彙', short: '語彙' },
  { id: 'grammar', label: 'N1 文法', short: '文法' },
  { id: 'reading', label: '読解練習', short: '読解' },
  { id: 'review', label: '誤答復習', short: '復習' },
  { id: 'compound-verbs', label: '複合動詞', short: '複合' },
  { id: 'live-reactions', label: '直播条反', short: '条反' },
  { id: 'history', label: '学習履歴', short: '履歴' },
]

function scrollPageStart() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

export default function App() {
  const [legacyReadingOpen, setLegacyReadingOpen] = useState(false)
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
  const { active, setActive, selectedDate, setSelectedDate, compoundSeriesId, setCompoundSeriesId,
    questionTarget, setQuestionTarget, questionLinkError, setQuestionLinkError } = useAppNavigation(() => {
    setLiveSearchTarget(null)
    setLessonSearchTarget(null)
    setCompoundOrigin(null)
    setLegacyReadingOpen(false)
    setMobileNavOpen(false)
  })
  const [readingMode, setReadingMode] = useState<ReadingMode>('japanese')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme, themeStorage] = useLocalStorage('n1-theme', 'light', decodeTheme)
  const [progress, setProgress, progressStorage] = useLocalStorage<StoredProgress>('n1-progress', initialProgress, decodeProgress)
  const [completedLessons, setCompletedLessons, completedStorage] = useLocalStorage<Record<string, boolean>>('n1-completed-lessons', {}, decodeCompleted)
  const storageStates = [themeStorage, progressStorage, completedStorage]
  const [today, setToday] = useState(tokyoDate)
  const { payload: { lesson, reviewFocus }, loading: lessonLoading, failed: lessonFailed, expired: lessonExpired, retry: retryLesson } = useLesson(selectedDate)
  const lessonUnavailable = (lessonLoading || lessonFailed) && !['compound-verbs', 'live-reactions', 'history'].includes(active)
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

  const reviewItems = useMemo(() => getLessonReviewItems(lesson, progress, today), [lesson, progress, today])

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
            <div className="quiet-stat"><Icon name={active === 'live-reactions' || active === 'compound-verbs' ? 'book' : 'clock'} size={17} /><span>{active === 'compound-verbs' ? '語彙を広げる' : active === 'live-reactions' ? '直播笔记' : lesson.practice ? `演習 約 ${lesson.practice.estimatedMinutes} 分` : `約 ${lesson.estimatedMinutes} 分`}</span></div>
            <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="読解テーマを切り替える"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
          </div>
        </header>

        <div className="content-shell">
          <AudioScope scope={['compound-verbs', 'live-reactions', 'history'].includes(active) || lessonUnavailable ? undefined : `lesson/${lesson.date}`} searchQuery={searchQuery}>
          {questionLinkError ? <p className="storage-notice" role="alert">指定された問題はこの教材に見つかりませんでした。分類から問題を選び直してください。学習記録は変更していません。</p> : null}
          {active !== 'live-reactions' ? <AudioAvailability /> : null}
          {lessonUnavailable ? lessonFailed ? <div className="storage-notice" role="alert"><p>{lessonExpired ? '教材が更新されています。ページを再読み込みすると、選択した日付から再開できます。' : 'この日の教材を読み込めませんでした。学習記録は保持されています。'}</p><button className="text-btn" onClick={lessonExpired ? () => reloadWithSearch(searchQuery) : retryLesson}>{lessonExpired ? 'ページを再読み込み' : '教材を再読み込み'}</button></div>
            : <p className="lesson-loading" role="status">この日の教材を読み込んでいます…</p> : null}
          {storageStates.some(state => state.failed) ? <div className="storage-notice" role="alert">
            <p>このブラウザーに学習記録を保存できません。学習は続けられますが、ページを閉じると今回の変更が失われる可能性があります。</p>
            <button className="text-btn" onClick={() => storageStates.forEach(state => state.retry())}>保存を再試行</button>
          </div> : storageStates.some(state => state.recovered) ? <div className="storage-notice" role="status">
            <p>保存データの一部を読み込めなかったため、その部分を初期状態に戻しました。読み込めた学習記録は保持しています。</p>
            <button className="text-btn" onClick={() => storageStates.forEach(state => state.dismiss())}>閉じる</button>
          </div> : null}
          {active === 'compound-verbs' && <ResourceBoundary resetKey={compoundSeriesId} searchQuery={searchQuery}><Suspense fallback={<p role="status">複合動詞を読み込んでいます…</p>}><CompoundVerbs selectedId={compoundSeriesId} onSelect={setCompoundSeriesId} origin={compoundOrigin} onReturn={returnToVocabulary}
            query={contentQuery} composing={searchComposing} onClear={() => changeSearch('')}
            selectionToken={searchSelection} step={searchStep} onLocated={() => setSearchLocated(count => count + 1)} /></Suspense></ResourceBoundary>}
          {active === 'live-reactions' && <ResourceBoundary searchQuery={searchQuery}><Suspense fallback={<p role="status">正在加载直播笔记…</p>}><LiveReactions query={contentQuery} composing={searchComposing} onClear={() => changeSearch('')} searchTarget={liveSearchTarget} onTargetLocated={() => setLiveSearchTarget(null)} /></Suspense></ResourceBoundary>}
          {!lessonUnavailable && <>
          {active === 'today' && <TodayPage lesson={lesson} highlight={highlight} go={go} isLatest={isLatest} historyEntry={historyEntry} today={today} progressValue={progressValue} practiceNavigation={practiceNavigation} practiceQuestionCount={practiceQuestions.length} practiceCount={practiceCount} reviewCount={reviewItems.length} reviewFocus={reviewFocus} />}

          {active === 'immersion' && <ImmersionPage lesson={lesson} highlight={highlight} go={go} readingMode={readingMode} setReadingMode={setReadingMode} completed={!!completedLessons[lesson.date]} markImmersionComplete={markImmersionComplete} />}

          {active === 'vocabulary' && <VocabularyPage lesson={lesson} highlight={highlight} go={go} practiceNavigation={practiceNavigation} practiceContent={practiceSection('vocabulary')} progress={progress} updateStatus={updateStatus} openCompoundSeries={openCompoundSeries} />}

          {active === 'grammar' && <GrammarPage lesson={lesson} highlight={highlight} go={go} practiceNavigation={practiceNavigation} practiceContent={practiceSection('grammar')} progress={progress} updateStatus={updateStatus} />}

          {active === 'reading' && <ReadingPage lesson={lesson} highlight={highlight} practiceNavigation={practiceNavigation} practiceContent={practiceSection('reading')} progress={progress} legacyReadingOpen={legacyReadingOpen} setLegacyReadingOpen={setLegacyReadingOpen} questionTarget={questionTarget} submitQuestion={submitQuestion} lessonHighlightQuery={lessonHighlightQuery} />}

          {active === 'review' && <ReviewPage lesson={lesson} reviewItems={reviewItems} manualReviewItems={manualReviewItems} go={go} openQuestion={openQuestion} setReturnCardTarget={setReturnCardTarget} />}

          </>}
          {active === 'history' && <HistoryPage lesson={lesson} today={today} openLesson={openLesson} searchQuery={searchQuery} />}
          </AudioScope>
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="モバイルクイックナビゲーション">
        {navigation.filter(item => ['today', 'immersion', 'vocabulary', 'grammar', 'reading'].includes(item.id)).map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.short}</span></button>)}
      </nav>
    </div>
  )
}
