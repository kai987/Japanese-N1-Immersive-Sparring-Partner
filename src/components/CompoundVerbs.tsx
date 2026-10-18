import { useEffect, useRef, useState } from 'react'
import { stopAudio } from '../lib/audioPlayer'
import { getSearchTerms } from '../lib/searchHighlight'
import { compoundVerbSeries, getCompoundSeriesById, getCompoundSeriesForWord, searchCompoundSeries } from '../lib/compoundVerbs'

import { AudioButton, SentenceAudio } from './AudioButton'
import { SearchHighlight } from './SearchHighlight'

const wordCount = new Set(compoundVerbSeries.flatMap(series => series.groups.flatMap(group => group.words.map(entry => entry.word)))).size

export interface CompoundVocabularyOrigin { date: string; id: string; word: string }
export default function CompoundVerbs({ selectedId, onSelect, origin, onReturn, query, composing, onClear, selectionToken, step, onLocated }: {
  selectedId: string; onSelect: (id: string) => void
  origin: CompoundVocabularyOrigin | null; onReturn: () => void
  query: string; composing: boolean; onClear: () => void
  selectionToken: number; step: { id: number; direction: number }; onLocated: () => void
}) {
  const [settledQuery, setSettledQuery] = useState('')
  const [selection, setSelection] = useState(0)
  const [hitIndex, setHitIndex] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const detailRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const hitsRef = useRef<HTMLElement[]>([])
  const lastStepRef = useRef(step.id)
  const contentQuery = query
  const hasSearch = getSearchTerms(query).length > 0
  const pending = composing || query !== settledQuery
  const matches = searchCompoundSeries(contentQuery)
  const selected = getCompoundSeriesById(selectedId) ?? compoundVerbSeries[0]
  const selectedVisible = matches.some(series => series.id === selected.id)

  useEffect(() => { if (!selectedVisible) stopAudio() }, [selectedVisible])

  const activateHit = (index: number) => {
    const hits = hitsRef.current
    if (!hits.length) return
    const current = (index + hits.length) % hits.length
    hits.forEach((hit, position) => {
      hit.classList.toggle('is-current', position === current)
      if (position === current) hit.setAttribute('aria-current', 'true')
      else hit.removeAttribute('aria-current')
    })
    setHitIndex(current)
    const hit = hits[current]
    hit.scrollIntoView({ block: 'center', behavior: 'instant' })
    // On short screens, keep the match below both sticky bars and above the
    // mobile navigation. Focus stays in the search field while typing.
    const toolbarBottom = searchRef.current?.getBoundingClientRect().bottom ?? 0
    const nav = document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect()
    const viewportBottom = nav && nav.height > 0 ? nav.top : window.innerHeight
    const rect = hit.getBoundingClientRect()
    const available = viewportBottom - toolbarBottom - 24
    if (available > rect.height && (rect.top < toolbarBottom + 8 || rect.bottom > viewportBottom - 8)) {
      window.scrollBy({ top: rect.top - (toolbarBottom + 12 + (available - rect.height) / 2), behavior: 'instant' })
    }
  }

  useEffect(() => {
    if (composing) return
    if (!getSearchTerms(query).length) { setSettledQuery(query); return }
    const timer = window.setTimeout(() => setSettledQuery(query), 350)
    return () => window.clearTimeout(timer)
  }, [query, composing])

  useEffect(() => {
    if (!hasSearch) {
      hitsRef.current = []
      setHitCount(0)
      setHitIndex(0)
      return
    }
    if (pending) return
    if (!matches.length) { hitsRef.current = []; setHitCount(0); setHitIndex(0); return }
    if (!selectedVisible) { onSelect(matches[0].id); return }
    const frame = window.requestAnimationFrame(() => {
      hitsRef.current = Array.from(detailRef.current?.querySelectorAll<HTMLElement>('mark.compound-search-hit') ?? [])
      setHitCount(hitsRef.current.length)
      setHitIndex(0)
      activateHit(0)
      onLocated()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [query, settledQuery, composing, selectedId, selection, selectionToken])

  useEffect(() => {
    if (!selection || hasSearch) return
    const frame = window.requestAnimationFrame(() => {
      const detail = detailRef.current
      detail?.scrollIntoView({ block: 'start', behavior: 'instant' })
      if (detail && searchRef.current) {
        const offset = detail.getBoundingClientRect().top - searchRef.current.getBoundingClientRect().bottom - 16
        if (offset < 0) window.scrollBy({ top: offset, behavior: 'instant' })
      }
      detail?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selection])

  useEffect(() => {
    if (step.id === lastStepRef.current) return
    lastStepRef.current = step.id
    if (composing) return
    if (pending) setSettledQuery(query)
    else activateHit(hitIndex + step.direction)
  }, [step])

  const select = (id: string, keepQuery = true) => {
    onSelect(id)
    if (!keepQuery) onClear()
    setSelection(count => count + 1)
  }
  const clear = () => {
    onClear()
    document.querySelector<HTMLInputElement>('.daily-search input')?.focus({ preventScroll: true })
  }
  const highlight = (text: string) => <SearchHighlight text={text} query={contentQuery} className="compound-search-hit" />
  return <div className="compound-page page-enter">
    <header className="compound-header">
      <span className="section-index">VOCABULARY SERIES</span>
      <h1>複合動詞</h1>
      <p>一个词，拓展成一个系列。按构词和含义整理，用例句区分相近表达。</p>
      <p className="compound-scope">{compoundVerbSeries.length} 个系列 · {wordCount} 个词语与相关表达 · 含基础、中级及进阶词汇</p>
    </header>
    {origin ? <div className="compound-origin">
      <div><strong>从「{origin.word}」拓展</strong><p>返回后继续学习 {origin.date} 的原词卡。</p></div>
      <button className="text-btn" onClick={onReturn}>元の語彙カードに戻る</button>
      {getCompoundSeriesForWord(origin.word).length > 1 ? <div className="compound-origin-links" aria-label="この語彙の関連シリーズ">
        {getCompoundSeriesForWord(origin.word).map(series => <button key={series.id} className={series.id === selected.id ? 'active' : ''} onClick={() => select(series.id)}>{series.title}</button>)}
      </div> : null}
    </div> : null}
    <div className="compound-search" ref={searchRef}>
      <div className="compound-find-controls">
        <p role="status" aria-live="polite">{hasSearch ? pending ? '正在搜索…' : `${hitCount ? hitIndex + 1 : 0} / ${hitCount} 处匹配 · ${matches.length} 个系列` : '使用顶部全站搜索，或选择一个系列。'}</p>
        {hasSearch ? <div className="compound-find-buttons">
          <button type="button" aria-label="前の一致へ" disabled={pending || hitCount < 2} onClick={() => activateHit(hitIndex - 1)}>↑ 上一处</button>
          <button type="button" aria-label="次の一致へ" disabled={pending || hitCount < 2} onClick={() => activateHit(hitIndex + 1)}>↓ 下一处</button>
        </div> : null}
      </div>
    </div>
    {matches.length ? <div className="compound-layout">
      <nav className="compound-series-nav" aria-label="複合動詞のシリーズ">
        {matches.map(series => <button className={`compound-series-button ${selectedVisible && selected.id === series.id ? 'active' : ''}`}
          key={series.id} data-series-id={series.id} aria-current={selectedVisible && selected.id === series.id ? 'page' : undefined}
          onClick={() => select(series.id)}>
          <strong>{series.title}</strong><span>{series.subtitle}</span>
          <small>{series.groups.reduce((count, group) => count + group.words.length, 0)} 个词语・{series.groups.length} 个分组</small>
        </button>)}
      </nav>
      {selectedVisible ? <article className="compound-detail" data-series-id={selected.id} ref={detailRef} tabIndex={-1}>
        <header className="compound-detail-head"><span className="section-index">SERIES {String(compoundVerbSeries.indexOf(selected) + 1).padStart(2, '0')}</span>
          <h2>{highlight(selected.title)}</h2><p className="compound-detail-subtitle">{highlight(selected.subtitle)}</p><p>{highlight(selected.summary)}</p><div className="compound-structure"><span>構造・意味</span><p>{highlight(selected.structure)}</p></div>
        </header>
        <aside className="compound-notes" aria-label="用法と分類のポイント"><strong>先分清结构，再记含义</strong><ul>{selected.notes.map(note => <li key={note}>{highlight(note)}</li>)}</ul></aside>
        {selected.groups.map((group, groupIndex) => <section className="compound-group" key={group.title}>
          <header><span>{String(groupIndex + 1).padStart(2, '0')}</span><div><h3>{highlight(group.title)}</h3><p>{highlight(group.description)}</p></div></header>
          <div>{group.words.map(entry => <article className={`compound-word-card ${origin?.word === entry.word ? 'is-origin' : ''}`} key={entry.word}>
            <div className="compound-word-heading"><h3 lang="ja">{highlight(entry.word)}</h3><span lang="ja">{highlight(entry.reading)}</span>{origin?.word === entry.word ? <small>元の語彙</small> : null}<AudioButton text={entry.word} speechText={entry.reading} /></div>
            <p className="compound-meaning" lang="zh-CN">{highlight(entry.meaning)}</p>
            <div className="compound-example"><p lang="ja"><SentenceAudio text={entry.example} renderText={highlight} /></p><p lang="zh-CN">{highlight(entry.translation)}</p></div>
            {entry.note ? <p className="compound-word-note" lang="zh-CN"><strong>辨析</strong>{highlight(entry.note)}</p> : null}
          </article>)}</div>
        </section>)}
        <footer className="compound-detail-footer">
          <h3>関連シリーズ</h3><div className="compound-related">{selected.relatedSeriesIds.map(id => {
            const related = getCompoundSeriesById(id)
            return related ? <button className="text-btn" key={id} onClick={() => select(id, false)}>{related.title} →</button> : null
          })}</div>
          <details className="compound-sources"><summary>分類・用法の参考資料</summary><ul>{selected.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>例句为学习用原创例句；分类说明与参考资料分别标示，扩展词并非全部属于 N1。</p></details>
        </footer>
      </article> : <div className="compound-search-prompt"><p>在左侧选择搜索结果，查看系列内容。</p><button className="text-btn" onClick={() => select(matches[0].id)}>查看「{matches[0].title}」</button></div>}
    </div> : <div className="empty-state"><h2>没有找到相关系列</h2><p>试试「合う」「間に合う」「取り」或「期限」。</p><button className="text-btn" onClick={clear}>显示全部系列</button></div>}
  </div>
}
