import { useEffect, useMemo, useRef, useState } from 'react'
import { lessons, reviewFocusByDate } from '../data/history'
import { createLessonSearchIndex, searchProject, type ProjectSearchResult } from '../lib/projectSearch'
import { SearchHighlight } from './SearchHighlight'

const lessonIndex = createLessonSearchIndex(lessons, reviewFocusByDate)

export function ProjectSearch({ query, contentQuery, onChange, onOpen, located, onNavigateMatches }: {
  query: string; contentQuery: string
  onChange: (query: string, composing: boolean) => void
  onOpen: (result: ProjectSearchResult) => void
  located: number
  onNavigateMatches?: (direction: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)
  const groups = useMemo(() => searchProject(contentQuery, lessonIndex), [contentQuery])
  const results = groups.flatMap(group => group.results)
  const showResults = open && !!query.trim() && !composingRef.current

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])
  // Once the compound page has located a match, reveal it without a popup
  // covering the reading area. Clicking the shared input reopens all results.
  useEffect(() => { setOpen(false) }, [located])

  const choose = (result: ProjectSearchResult) => { onOpen(result); setOpen(false); setSelectedIndex(-1) }
  const clear = () => {
    composingRef.current = false
    onChange('', false)
    setSelectedIndex(-1)
    inputRef.current?.focus({ preventScroll: true })
  }
  let resultIndex = -1
  return <div className="daily-search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
  }}>
    <div className="daily-search-input-wrap">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
      <input ref={inputRef} value={query}
        onChange={event => { onChange(event.target.value, composingRef.current); setSelectedIndex(-1); setOpen(true) }}
        onCompositionStart={() => { composingRef.current = true; onChange(query, true) }}
        onCompositionEnd={event => { composingRef.current = false; onChange(event.currentTarget.value, false); setOpen(true) }}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
        onKeyDown={event => {
          if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setSelectedIndex(-1) }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!results.length) return
            event.preventDefault()
            setOpen(true)
            const direction = event.key === 'ArrowDown' ? 1 : -1
            const index = selectedIndex < 0 ? (direction === 1 ? 0 : results.length - 1) : (selectedIndex + direction + results.length) % results.length
            setSelectedIndex(index)
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
    {showResults ? <div id="project-search-results" className="daily-search-results" role="region" aria-label="教材の検索結果">
      <div className="daily-search-results-head"><span>{results.length ? `${results.length} 条结果` : '没有找到匹配内容'}</span><small>↑ ↓ 选择 · Enter 打开 · Esc 关闭</small></div>
      {groups.map(group => <section key={group.kind} className="project-search-group" aria-label={group.label}>
        <h2>{group.label}<small>最多 4 条</small></h2>
        {group.results.map(result => {
          const index = ++resultIndex
          return <button id={`project-search-result-${index}`} key={index}
            className={`daily-search-result ${index === selectedIndex ? 'is-selected' : ''}`} data-search-kind={result.kind} data-search-anchor={result.kind === 'lesson' ? result.anchor : undefined}
            data-search-target={result.kind === 'compound' ? result.seriesId : result.kind === 'live' ? result.groupId : result.date}
            onMouseDown={event => event.preventDefault()} onClick={() => choose(result)}>
            <span className="daily-search-date">{result.kind === 'compound' ? <><b>複合</b><small>シリーズ</small></> : <><b>{result.date.slice(5).replace('-', '/')}</b><small>{result.kind === 'lesson' ? `Day ${result.day}` : '直播'}</small></>}</span>
            <span className="daily-search-body"><span className="daily-search-label"><SearchHighlight text={result.label} query={contentQuery} /></span><strong><SearchHighlight text={result.title} query={contentQuery} /></strong><small><SearchHighlight text={result.snippet} query={contentQuery} /></small></span>
            {result.kind === 'lesson' ? <span className="daily-search-count">{result.hits}か所</span> : null}
          </button>
        })}
      </section>)}
      {!results.length ? <div className="daily-search-empty">试试日语、读音或中文，例如「間に合う」「はなしあう」「期限」。</div> : null}
    </div> : null}
  </div>
}
