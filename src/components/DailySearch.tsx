import { useEffect, useMemo, useRef, useState } from 'react'
import { lessons, reviewFocusByDate } from '../data/history'
import type { DailyLesson, SectionId } from '../types'

type SearchResult = {
  date: string
  day: number
  title: string
  section: SectionId
  label: string
  snippet: string
  score: number
  hits: number
}

type SearchChunk = {
  section: SectionId
  label: string
  text: string
  priority: number
}

const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('ja-JP')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const compact = (value: string) => normalize(value).replace(/\s+/g, '')

const fuzzySubsequenceScore = (query: string, target: string) => {
  if (query.length < 3 || target.length < query.length) return 0
  let q = 0
  let start = -1
  let end = -1
  for (let i = 0; i < target.length && q < query.length; i += 1) {
    if (target[i] === query[q]) {
      if (start === -1) start = i
      end = i
      q += 1
    }
  }
  if (q !== query.length || start === -1) return 0
  const spread = end - start + 1
  const density = query.length / spread
  return density >= 0.45 ? 18 * density : 0
}

const scoreText = (query: string, text: string, priority: number) => {
  const q = normalize(query)
  const qCompact = compact(query)
  const normalizedText = normalize(text)
  const compactText = compact(text)
  if (!q || !qCompact || !compactText) return 0

  let score = 0
  if (compactText === qCompact) score += 160
  else if (compactText.startsWith(qCompact)) score += 105
  else if (compactText.includes(qCompact)) score += 78

  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length > 1) {
    const matched = tokens.filter((token) => normalizedText.includes(token)).length
    if (matched === tokens.length) score += 52
    else score += (matched / tokens.length) * 24
  }

  if (!score) score += fuzzySubsequenceScore(qCompact, compactText)
  return score ? score + priority : 0
}

const makeSnippet = (text: string, query: string) => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 112) return clean
  const index = clean.toLocaleLowerCase('ja-JP').indexOf(query.trim().toLocaleLowerCase('ja-JP'))
  if (index < 0) return `${clean.slice(0, 109)}…`
  const start = Math.max(0, index - 34)
  const end = Math.min(clean.length, index + query.length + 70)
  return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`
}

const lessonChunks = (lesson: DailyLesson): SearchChunk[] => {
  const chunks: SearchChunk[] = [
    { section: 'today', label: 'テーマ', text: `${lesson.title} ${lesson.subtitle}`, priority: 38 },
    { section: 'immersion', label: '没入読解', text: `${lesson.immersion.title} ${lesson.immersion.paragraphs.join(' ')} ${lesson.immersion.translations.join(' ')} ${lesson.immersion.analysis.join(' ')}`, priority: 25 },
    { section: 'reading', label: '読解', text: `${lesson.reading.title} ${lesson.reading.paragraphs.join(' ')} ${lesson.reading.question.prompt} ${lesson.reading.question.options.join(' ')} ${lesson.reading.question.explanation}`, priority: 22 },
  ]

  lesson.vocabulary.forEach((item) => {
    chunks.push({
      section: 'vocabulary',
      label: `語彙 · ${item.word}`,
      text: [item.word, item.reading, item.meaning, item.partOfSpeech, item.example, item.translation, ...item.collocations, item.nuance].join(' '),
      priority: 34,
    })
  })

  lesson.grammar.forEach((item) => {
    chunks.push({
      section: 'grammar',
      label: `文法 · ${item.pattern}`,
      text: [item.pattern, item.meaning, item.form, item.register, item.explanation, item.example, item.translation, item.comparison].join(' '),
      priority: 32,
    })
  })

  ;(reviewFocusByDate[lesson.date] ?? []).forEach((item) => {
    chunks.push({ section: 'review', label: `誤答復習 · ${item.type === '词汇' ? '語彙' : item.type === '读解' ? '読解' : item.type}`, text: `${item.title} ${item.detail}`, priority: 30 })
  })

  return chunks
}

const searchIndex = lessons.map(lesson => ({ lesson, chunks: lessonChunks(lesson) }))

const searchLessons = (query: string): SearchResult[] => {
  if (!normalize(query)) return []

  return searchIndex
    .map(({ lesson, chunks }) => {
      const scored = chunks
        .map((chunk) => ({ ...chunk, score: scoreText(query, chunk.text, chunk.priority) }))
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)

      if (!scored.length) return null
      const best = scored[0]
      return {
        date: lesson.date,
        day: lesson.day,
        title: lesson.title,
        section: best.section,
        label: best.label,
        snippet: makeSnippet(best.text, query),
        score: best.score + Math.min(scored.length, 8) * 2,
        hits: scored.length,
      }
    })
    .filter((item): item is SearchResult => Boolean(item))
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
    .slice(0, 8)
}

export function DailySearch({ onOpen }: { onOpen: (date: string, section: SectionId) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchLessons(query), [query])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const choose = (result: SearchResult) => {
    onOpen(result.date, result.section)
    setQuery('')
    setOpen(false)
  }

  return (
    <div
      className="daily-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="daily-search-input-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'Enter' && results[0]) choose(results[0])
          }}
          placeholder="教材を検索：語彙、文法、AI…"
          aria-label="毎日のN1教材を検索"
          autoComplete="off"
          spellCheck={false}
        />
        {query ? <button className="daily-search-clear" onClick={() => setQuery('')} aria-label="検索をクリア">×</button> : <span className="daily-search-hint">⌘ K</span>}
      </div>

      {open && query.trim() ? (
        <div className="daily-search-results" role="region" aria-label="教材の検索結果">
          <div className="daily-search-results-head">
            <span>{results.length ? `${results.length}日分を表示（最大8件）` : '一致する教材がありません'}</span>
            <small>日本語・中国語・読み・キーワードで検索できます</small>
          </div>
          {results.map((result) => (
            <button key={result.date} className="daily-search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(result)}>
              <span className="daily-search-date"><b>{result.date.slice(5).replace('-', '/')}</b><small>Day {result.day}</small></span>
              <span className="daily-search-body">
                <span className="daily-search-label">{result.label}</span>
                <strong>{result.title}</strong>
                <small>{result.snippet}</small>
              </span>
              <span className="daily-search-count">{result.hits > 1 ? `${result.hits}か所` : '1か所'}</span>
            </button>
          ))}
          {!results.length ? <div className="daily-search-empty">短いキーワードや読みで検索してみましょう。例：「かんかつ」「Security」「権限」。</div> : null}
        </div>
      ) : null}
    </div>
  )
}
