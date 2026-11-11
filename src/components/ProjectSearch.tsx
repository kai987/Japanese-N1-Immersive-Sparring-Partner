import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { searchProject, type LessonSearchIndex, type ProjectSearchResult } from '../lib/projectSearch'
import assets from 'virtual:n1-data-assets'
import { SearchHighlight } from './SearchHighlight'

const emptyLessonIndex: LessonSearchIndex = []
class SearchIndexRequestError extends Error {
  constructor(readonly status: number) { super(`Search index request failed (${status})`) }
}
const resultKey = (result: ProjectSearchResult) => {
  if (result.kind === 'lesson') return `lesson/${result.date}`
  if (result.kind === 'compound') return `compound/${result.seriesId}`
  return `live/${result.groupId}`
}

let indexRequest: Promise<LessonSearchIndex> | undefined
function loadLessonSearchIndex(): Promise<LessonSearchIndex> {
  // Keep the large index out of the first screen. Fetch failures can be retried;
  // browsers permanently cache failed native dynamic imports in this page.
  indexRequest ??= fetch(assets.searchIndex, { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new SearchIndexRequestError(response.status)
    return response.json() as Promise<LessonSearchIndex>
  }).then(index => {
    if (!Array.isArray(index)) throw new Error('Unexpected search index')
    return index
  })
    .catch(error => { indexRequest = undefined; throw error })
  return indexRequest
}

export function ProjectSearch({ query, contentQuery, onChange, onOpen, located, onNavigateMatches }: {
  query: string; contentQuery: string
  onChange: (query: string, composing: boolean) => void
  onOpen: (result: ProjectSearchResult) => void
  located: number
  onNavigateMatches?: (direction: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [lessonIndex, setLessonIndex] = useState<LessonSearchIndex | null>(null)
  const [loadError, setLoadError] = useState<'missing' | 'unavailable' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  useEffect(() => {
    const historyState = window.history.state
    if (typeof historyState?.n1SearchQuery !== 'string') return
    const { n1SearchQuery: resumedQuery, ...state } = historyState
    window.history.replaceState(state, '')
    onChange(resumedQuery, false)
    setOpen(true)
  }, [onChange])
  const ensureLoaded = useCallback(() => {
    if (lessonIndex || loadingRef.current) return
    loadingRef.current = true
    setLoadError(null)
    void loadLessonSearchIndex().then(index => {
      if (!mountedRef.current) return
      setLessonIndex(index)
    }).catch(error => {
      if (mountedRef.current) setLoadError(error instanceof SearchIndexRequestError && error.status === 404 ? 'missing' : 'unavailable')
    })
      .finally(() => { loadingRef.current = false })
  }, [lessonIndex])
  useEffect(() => { if (contentQuery.trim()) ensureLoaded() }, [contentQuery, ensureLoaded])
  useEffect(() => { setExpanded(false); setSelected(null) }, [contentQuery])
  const groups = useMemo(() => searchProject(contentQuery, lessonIndex ?? emptyLessonIndex, { limit: expanded ? null : 4 }), [contentQuery, lessonIndex, expanded])
  const results = groups.flatMap(group => group.results)
  const selectedIndex = results.findIndex(result => resultKey(result) === selected)
  const total = groups.reduce((count, group) => count + group.total, 0)
  const hasMore = groups.some(group => group.total > group.results.length)
  const showResults = open && !!query.trim() && !composingRef.current

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
        ensureLoaded()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [ensureLoaded])
  // Revealing a located match must not put the popup over the reading area.
  useEffect(() => { if (located) setOpen(false) }, [located])

  const refreshSearch = () => {
    window.history.replaceState({ ...window.history.state, n1SearchQuery: contentQuery }, '')
    window.location.reload()
  }
  const choose = (result: ProjectSearchResult) => { onOpen(result); setOpen(false); setSelected(null) }
  const clear = () => {
    composingRef.current = false
    onChange('', false)
    setSelected(null)
    setExpanded(false)
    inputRef.current?.focus({ preventScroll: true })
  }
  let resultIndex = -1
  return <div className="daily-search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
  }}>
    <div className="daily-search-input-wrap">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
      <input ref={inputRef} value={query}
        onChange={event => { onChange(event.target.value, composingRef.current); setSelected(null); setExpanded(false); setOpen(true) }}
        onCompositionStart={() => { composingRef.current = true; onChange(query, true) }}
        onCompositionEnd={event => { composingRef.current = false; onChange(event.currentTarget.value, false); setExpanded(false); setOpen(true) }}
        onFocus={() => { setOpen(true); ensureLoaded() }} onClick={() => setOpen(true)}
        onKeyDown={event => {
          if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setSelected(null) }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!results.length) return
            event.preventDefault()
            setOpen(true)
            const direction = event.key === 'ArrowDown' ? 1 : -1
            const index = selectedIndex < 0 ? (direction === 1 ? 0 : results.length - 1) : (selectedIndex + direction + results.length) % results.length
            setSelected(resultKey(results[index]))
            window.requestAnimationFrame(() => document.getElementById(`project-search-result-${index}`)?.scrollIntoView({ block: 'nearest' }))
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            if ((!showResults || event.shiftKey) && onNavigateMatches) onNavigateMatches(event.shiftKey ? -1 : 1)
            else if (results[selectedIndex < 0 ? 0 : selectedIndex]) choose(results[selectedIndex < 0 ? 0 : selectedIndex])
          }
        }}
        placeholder="搜索全部教材、复合动词、直播笔记…" aria-label="全站搜索"
        aria-controls={showResults ? 'project-search-results' : undefined} aria-expanded={!!showResults}
        aria-describedby="project-search-help" autoComplete="off" spellCheck={false} />
      {query ? <button className="daily-search-clear" onClick={clear} aria-label="検索をクリア">×</button> : <span className="daily-search-hint">⌘ K</span>}
    </div>
    <span id="project-search-help" className="sr-only">搜索日语、读音或中文。方向键选择结果，Enter 打开，Escape 关闭结果；关闭结果后可用 Enter／Shift+Enter 跳转复合动词中的匹配。</span>
    {showResults ? <div id="project-search-results" className="daily-search-results" role="region" aria-label="教材の検索結果" aria-busy={!lessonIndex && !loadError && !results.length}>
      <div className="daily-search-results-head"><span>{total ? `${total} 条结果` : lessonIndex ? '没有找到匹配内容' : '全站搜索'}</span><small>↑ ↓ 选择 · Enter 打开 · Esc 关闭</small></div>
      {groups.map(group => <section key={group.kind} className="project-search-group" aria-label={group.label}>
        <h2>{group.label}<small>显示 {group.results.length} / {group.total} 条</small></h2>
        {group.results.map(result => {
          const index = ++resultIndex
          return <button id={`project-search-result-${index}`} key={resultKey(result)}
            className={`daily-search-result ${index === selectedIndex ? 'is-selected' : ''}`} data-search-kind={result.kind} data-search-anchor={result.kind === 'lesson' ? result.anchor : undefined}
            data-search-target={result.kind === 'compound' ? result.seriesId : result.kind === 'live' ? result.groupId : result.date}
            onMouseDown={event => event.preventDefault()} onClick={() => choose(result)}>
            <span className="daily-search-date">{result.kind === 'compound' ? <><b>複合</b><small>シリーズ</small></> : <><b>{result.date.slice(5).replace('-', '/')}</b><small>{result.kind === 'lesson' ? `Day ${result.day}` : '直播'}</small></>}</span>
            <span className="daily-search-body"><span className="daily-search-label"><SearchHighlight text={result.label} query={contentQuery} /></span><strong><SearchHighlight text={result.title} query={contentQuery} /></strong><small><SearchHighlight text={result.snippet} query={contentQuery} /></small></span>
            {result.kind === 'lesson' ? <span className="daily-search-count">{result.hits}か所</span> : null}
          </button>
        })}
      </section>)}
      {hasMore || expanded ? <div className="project-search-more"><button onMouseDown={event => event.preventDefault()} onClick={() => { setExpanded(value => !value); setSelected(null) }} aria-expanded={expanded}>
        {expanded ? '收起结果' : `查看全部结果（共 ${total} 条）`}
      </button></div> : null}
      {lessonIndex && !results.length ? <div className="daily-search-empty">试试日语、读音或中文，例如「間に合う」「はなしあう」「期限」。</div> : null}
      {!lessonIndex ? <div className="daily-search-empty" role="status">
        {loadError === 'missing' ? <>
          <p>每日教材的搜索索引已失效。刷新页面后可用原关键词继续搜索。</p>
          <button className="text-btn" onMouseDown={event => event.preventDefault()} onClick={refreshSearch}>刷新页面并继续搜索</button>
        </> : loadError ? <>
          <p>每日教材的搜索索引暂时无法加载，已输入的关键词会保留。</p>
          <button className="text-btn" onMouseDown={event => event.preventDefault()} onClick={ensureLoaded}>重试加载搜索</button>
        </> : '正在加载搜索索引…'}
      </div> : null}
    </div> : null}
  </div>
}
