import type { DailyLesson, ReadingMode, SectionId } from '../types.ts'
import { searchCompoundSeries } from './compoundVerbs.ts'
import { liveUnits } from '../data/live-reaction-units.ts'
import { liveGroupSearchFields, matchesLiveGroup } from './liveReactions.ts'
import { getSearchRanges, getSearchTerms } from './searchHighlight.ts'

type ReviewFocus = Record<string, { type: string; title: string; detail: string }[]>

export type LessonSearchResult = {
  kind: 'lesson'
  date: string
  day: number
  title: string
  section: SectionId
  anchor: string
  readingMode?: ReadingMode
  label: string
  snippet: string
  score: number
  hits: number
}

type SearchChunk = {
  section: SectionId
  anchor: string
  readingMode?: ReadingMode
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
  const index = getSearchRanges(clean, query)[0]?.start ?? -1
  if (index < 0) return `${clean.slice(0, 109)}…`
  const start = Math.max(0, index - 34)
  const end = Math.min(clean.length, index + query.length + 70)
  return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`
}

const lessonChunks = (lesson: DailyLesson, reviewFocusByDate: ReviewFocus): SearchChunk[] => {
  const chunks: SearchChunk[] = [
    { section: 'today', anchor: 'lesson-theme', label: 'テーマ', text: `${lesson.title} ${lesson.subtitle}`, priority: 38 },
    { section: 'immersion', anchor: 'immersion-title', label: '没入読解', text: lesson.immersion.title, priority: 25 },
    { section: 'reading', anchor: 'reading-title', label: '読解', text: lesson.reading.title, priority: 22 },
    // Answer explanations are hidden until submission. Index the question and
    // choices, so opening a search hit never reveals an unsubmitted answer.
    { section: 'reading', anchor: 'reading-question', label: '読解', text: [lesson.reading.question.prompt, ...lesson.reading.question.options].join(' '), priority: 22 },
  ]
  lesson.immersion.paragraphs.forEach((text, index) => {
    const anchor = `immersion-paragraph-${index}`
    chunks.push({ section: 'immersion', anchor, label: '没入読解', text, priority: 25, readingMode: 'japanese' })
    if (lesson.immersion.translations[index]) chunks.push({ section: 'immersion', anchor, label: '没入読解 · 日中対訳', text: lesson.immersion.translations[index], priority: 25, readingMode: 'bilingual' })
    if (lesson.immersion.analysis[index]) chunks.push({ section: 'immersion', anchor, label: '没入読解 · 解説', text: lesson.immersion.analysis[index], priority: 25, readingMode: 'analysis' })
  })
  lesson.reading.paragraphs.forEach((text, index) => {
    chunks.push({ section: 'reading', anchor: `reading-paragraph-${index}`, label: '読解', text, priority: 22 })
  })

  lesson.vocabulary.forEach((item) => {
    chunks.push({
      section: 'vocabulary',
      anchor: `vocabulary-${item.id}`,
      label: `語彙 · ${item.word}`,
      text: [item.word, item.reading, item.meaning, item.partOfSpeech, item.example, item.translation, ...item.collocations, item.nuance].join(' '),
      priority: 34,
    })
  })

  lesson.grammar.forEach((item) => {
    chunks.push({
      section: 'grammar',
      anchor: `grammar-${item.id}`,
      label: `文法 · ${item.pattern}`,
      text: [item.pattern, item.meaning, item.form, item.register, item.explanation, item.example, item.translation, item.comparison].join(' '),
      priority: 32,
    })
  })

  ;(reviewFocusByDate[lesson.date] ?? []).forEach((item, index) => {
    chunks.push({ section: 'review', anchor: `review-${index}`, label: `誤答復習 · ${item.type === '词汇' ? '語彙' : item.type === '读解' ? '読解' : item.type}`, text: `${item.title} ${item.detail}`, priority: 30 })
  })

  return chunks
}

export const createLessonSearchIndex = (lessons: DailyLesson[], reviewFocusByDate: ReviewFocus) => lessons.map(lesson => ({ lesson, chunks: lessonChunks(lesson, reviewFocusByDate) }))

const searchLessons = (query: string, searchIndex: ReturnType<typeof createLessonSearchIndex>): LessonSearchResult[] => {
  if (!normalize(query)) return []

  return searchIndex
    .map<LessonSearchResult | null>(({ lesson, chunks }) => {
      const scored = chunks
        .map((chunk) => ({ ...chunk, score: scoreText(query, chunk.text, chunk.priority) }))
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)

      if (!scored.length) return null
      const best = scored[0]
      return {
        kind: 'lesson' as const,
        date: lesson.date,
        day: lesson.day,
        title: lesson.title,
        section: best.section,
        anchor: best.anchor,
        readingMode: best.readingMode,
        label: best.label,
        snippet: makeSnippet(best.text, query),
        score: best.score + Math.min(scored.length, 8) * 2,
        hits: scored.length,
      }
    })
    .filter((item): item is LessonSearchResult => Boolean(item))
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
    .slice(0, 4)
}


export type CompoundSearchResult = { kind: 'compound'; seriesId: string; title: string; label: string; snippet: string }
export type LiveSearchResult = { kind: 'live'; unitId: string; groupId: string; date: string; title: string; label: string; snippet: string }
export type ProjectSearchResult = LessonSearchResult | CompoundSearchResult | LiveSearchResult
export interface SearchResultGroup { kind: ProjectSearchResult['kind']; label: string; results: ProjectSearchResult[] }

// Use the same per-field matching as the compound page. Each category has its
// own result budget so daily history cannot crowd series or live notes out.
export function searchProject(query: string, lessonIndex: ReturnType<typeof createLessonSearchIndex>): SearchResultGroup[] {
  if (!getSearchTerms(query).length) return []
  const bestSnippet = (fields: string[]) => makeSnippet(fields.find(text => getSearchRanges(text, query).length) ?? fields[0], query)
  const compounds: CompoundSearchResult[] = searchCompoundSeries(query).slice(0, 4).map(series => {
    const entries = series.groups.flatMap(group => group.words)
    const entry = entries.find(item => getSearchRanges(item.word, query).length || getSearchRanges(item.reading, query).length)
    const fields = [series.title, series.subtitle, series.summary, series.structure, ...series.notes,
      ...series.groups.flatMap(group => [group.title, group.description, ...group.words.flatMap(item => [item.word, item.reading, item.meaning, item.example, item.translation, item.note ?? ''])])]
    return { kind: 'compound', seriesId: series.id, title: series.title,
      label: entry ? `${entry.word} · ${entry.reading}` : series.subtitle, snippet: bestSnippet(fields) }
  })
  const live: LiveSearchResult[] = liveUnits.flatMap(unit => unit.groups.filter(group => matchesLiveGroup(group, query)).map(group => ({
    kind: 'live' as const, unitId: unit.id, groupId: group.id, date: unit.date,
    title: group.title, label: unit.title, snippet: bestSnippet(liveGroupSearchFields(group)),
  }))).slice(0, 4)
  return [
    { kind: 'lesson', label: '每日教材', results: searchLessons(query, lessonIndex) },
    { kind: 'compound', label: '复合动词', results: compounds },
    { kind: 'live', label: '直播笔记', results: live },
  ].filter(group => group.results.length) as SearchResultGroup[]
}
