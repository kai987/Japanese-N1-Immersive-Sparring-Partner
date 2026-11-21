import type { DailyLesson, ReadingMode, SectionId } from '../types.ts'
import type { CompoundVerbSeries } from '../data/compound-verbs.ts'
import type { LiveUnit } from '../data/live-reaction-units.ts'
import { liveGroupSearchFields } from './liveReactions.ts'
import { getSearchRanges, getSearchTerms, normalizeSearchText } from './searchHighlight.ts'
import { practiceCategoryLabels, practiceKindLabels } from './practice.ts'
import { questionElementId } from './questionReview.ts'

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

export type SearchChunk = {
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

export interface IndexedSearchChunk extends SearchChunk { normalized: string; compact: string }
export interface LessonSearchRecord { lesson: Pick<DailyLesson, 'date' | 'day' | 'title'>; chunks: IndexedSearchChunk[] }
export type LessonSearchIndex = LessonSearchRecord[]
interface PreparedQuery { raw: string; normalized: string; compact: string; tokens: string[]; terms: string[]; literal: string }
const prepareQuery = (raw: string): PreparedQuery => {
  const normalized = normalize(raw)
  return { raw, normalized, compact: normalized.replace(/\s+/g, ''), tokens: normalized.split(/\s+/).filter(Boolean),
    terms: getSearchTerms(raw), literal: normalizeSearchText(raw) }
}
const prepareChunk = (chunk: SearchChunk): IndexedSearchChunk => {
  const normalized = normalize(chunk.text)
  return { ...chunk, normalized, compact: normalized.replace(/\s+/g, '') }
}

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

const scoreText = (query: PreparedQuery, chunk: IndexedSearchChunk) => {
  if (!query.normalized || !query.compact || !chunk.compact) return 0
  let score = 0
  if (chunk.compact === query.compact) score += 160
  else if (chunk.compact.startsWith(query.compact)) score += 105
  else if (chunk.compact.includes(query.compact)) score += 78
  if (query.tokens.length > 1) {
    const matched = query.tokens.filter(token => chunk.normalized.includes(token)).length
    score += matched === query.tokens.length ? 52 : (matched / query.tokens.length) * 24
  }
  if (!score) score += fuzzySubsequenceScore(query.compact, chunk.compact)
  return score ? score + chunk.priority : 0
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
  lesson.practice?.groups.forEach(group => {
    const label = `${practiceCategoryLabels[group.category]}練習 · ${practiceKindLabels[group.kind]}`
    const anchor = group.id
    chunks.push({ section: group.category, anchor, label, text: [group.title, group.instructions, ...group.paragraphs,
      ...(group.table ? [group.table.caption, ...group.table.headers, ...group.table.rows.flat()] : [])].join(' '), priority: 26 })
    group.questions.forEach(question => {
      chunks.push({ section: group.category, anchor: questionElementId(question.id), label,
        text: [question.questionType ?? '', question.prompt, ...question.options].join(' '), priority: 28 })
    })
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
    chunks.push({ section: 'today', anchor: `review-${index}`, label: `補充知識 · ${item.type === '词汇' ? '語彙' : item.type === '读解' ? '読解' : item.type}`, text: `${item.title} ${item.detail}`, priority: 30 })
  })

  return chunks
}

/** Build once (at publication time in the app), preserving original text for safe highlights. */
export const createLessonSearchIndex = (lessons: DailyLesson[], reviewFocusByDate: ReviewFocus): LessonSearchIndex => lessons.map(lesson => ({
  lesson: { date: lesson.date, day: lesson.day, title: lesson.title },
  chunks: lessonChunks(lesson, reviewFocusByDate).map(prepareChunk),
}))

export type CompoundSearchResult = { kind: 'compound'; seriesId: string; title: string; label: string; snippet: string }
export type LiveSearchResult = { kind: 'live'; unitId: string; groupId: string; date: string; title: string; label: string; snippet: string }
export type ProjectSearchResult = LessonSearchResult | CompoundSearchResult | LiveSearchResult
export interface SearchResultGroup { kind: ProjectSearchResult['kind']; label: string; results: ProjectSearchResult[]; total: number }
export interface ProjectSearchOptions { /** null returns every match; omitted keeps four previews per category. */ limit?: number | null; notes?: ProjectNotesIndex }

export interface PreparedField { text: string; normalized: string }
const prepareFields = (fields: string[]): PreparedField[] => fields.map(text => ({ text, normalized: normalizeSearchText(text) }))
const matchesFields = (query: PreparedQuery, fields: PreparedField[]) => query.terms.every(term => fields.some(field => field.normalized.includes(term)))
const fieldScore = (query: PreparedQuery, fields: PreparedField[]) => {
  let best = 0
  for (const field of fields) {
    if (field.normalized === query.literal) return 400
    if (field.normalized.startsWith(query.literal)) best = Math.max(best, 250)
    else if (field.normalized.includes(query.literal)) best = Math.max(best, 180)
  }
  return best
}
const bestSnippet = (fields: PreparedField[], query: PreparedQuery) => makeSnippet(
  fields.find(field => query.terms.some(term => field.normalized.includes(term)))?.text ?? fields[0]?.text ?? '', query.raw)

export interface CompoundNoteIndex {
  series: Pick<CompoundVerbSeries, 'id' | 'title' | 'subtitle'>
  order: number
  entries: { word: string; reading: string }[]
  fields: PreparedField[]
  searchable: PreparedField[]
  words: PreparedField[]
  title: PreparedField[]
}
export interface LiveNoteIndex {
  unit: Pick<LiveUnit, 'id' | 'date' | 'title'>
  group: { id: string; title: string }
  order: number
  fields: PreparedField[]
  words: PreparedField[]
  title: PreparedField[]
}
export interface ProjectNotesIndex { compounds: CompoundNoteIndex[]; live: LiveNoteIndex[] }
const emptyNotes: ProjectNotesIndex = { compounds: [], live: [] }

/** Build-time projection: the browser never imports the full note datasets for search. */
export function createProjectNotesIndex(compoundVerbSeries: CompoundVerbSeries[], liveUnits: LiveUnit[]): ProjectNotesIndex {
  const compounds = compoundVerbSeries.map((series, order) => {
  const entries = series.groups.flatMap(group => group.words)
  const fields = prepareFields([series.title, series.subtitle, series.summary, series.structure, ...series.notes,
    ...series.groups.flatMap(group => [group.title, group.description, ...group.words.flatMap(item => [item.word, item.reading, item.meaning, item.example, item.translation, item.note ?? ''])])])
  return { series: { id: series.id, title: series.title, subtitle: series.subtitle }, order,
    entries: entries.map(({ word, reading }) => ({ word, reading })), fields, searchable: [...fields, ...prepareFields(series.triggers)],
    words: prepareFields(entries.flatMap(entry => [entry.word, entry.reading])), title: prepareFields([series.title, series.subtitle]) }
})
  const live = liveUnits.flatMap(unit => unit.groups.map((group, order) => ({
  unit: { id: unit.id, date: unit.date, title: unit.title }, group: { id: group.id, title: group.title }, order, fields: prepareFields(liveGroupSearchFields(group)),
  words: prepareFields(group.entries.flatMap(entry => [entry.expression, entry.reading])),
  title: prepareFields([group.title, group.subtitle]),
})))
  return { compounds, live }
}
interface RankedLesson { lesson: LessonSearchRecord['lesson']; best: IndexedSearchChunk; score: number; hits: number }
interface RankedNotes<T> { item: T; score: number }
interface RankedResults { query: PreparedQuery; lessons: RankedLesson[]; compounds: RankedNotes<CompoundNoteIndex>[]; live: RankedNotes<LiveNoteIndex>[] }
const queryCache = new WeakMap<LessonSearchIndex, WeakMap<ProjectNotesIndex, Map<string, RankedResults>>>()

function rankProject(query: PreparedQuery, index: LessonSearchIndex, notes: ProjectNotesIndex): RankedResults {
  const lessons: RankedLesson[] = []
  for (const { lesson, chunks } of index) {
    let best: IndexedSearchChunk | undefined, bestScore = 0, hits = 0
    for (const chunk of chunks) {
      const score = scoreText(query, chunk)
      if (score <= 0) continue
      hits++
      if (score > bestScore) { best = chunk; bestScore = score }
    }
    if (best) lessons.push({ lesson, best, hits, score: bestScore + Math.min(hits, 8) * 2 })
  }
  lessons.sort((a, b) => b.score - a.score || b.lesson.date.localeCompare(a.lesson.date))
  const compounds = notes.compounds.filter(item => matchesFields(query, item.searchable)).map(item => ({ item,
    score: fieldScore(query, item.words) * 4 || fieldScore(query, item.title) }))
    .sort((a, b) => b.score - a.score || a.item.order - b.item.order)
  const live = notes.live.filter(item => matchesFields(query, item.fields)).map(item => ({ item,
    score: fieldScore(query, item.words) * 4 || fieldScore(query, item.title) }))
    .sort((a, b) => b.score - a.score || b.item.unit.date.localeCompare(a.item.unit.date) || a.item.order - b.item.order)
  return { query, lessons, compounds, live }
}

/** Search each category independently; previews cannot hide the existence of older matches. */
export function searchProject(query: string, lessonIndex: LessonSearchIndex, { limit = 4, notes = emptyNotes }: ProjectSearchOptions = {}): SearchResultGroup[] {
  const prepared = prepareQuery(query)
  if (!prepared.terms.length) return []
  if (limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) throw new Error('Invalid search result limit')
  let byNotes = queryCache.get(lessonIndex)
  if (!byNotes) { byNotes = new WeakMap(); queryCache.set(lessonIndex, byNotes) }
  let cache = byNotes.get(notes)
  if (!cache) { cache = new Map(); byNotes.set(notes, cache) }
  let ranked = cache.get(query)
  if (!ranked) {
    ranked = rankProject(prepared, lessonIndex, notes)
    cache.set(query, ranked)
    if (cache.size > 12) cache.delete(cache.keys().next().value!)
  }
  const take = <T,>(items: T[]) => limit === null ? items : items.slice(0, limit)
  const lessonResults: LessonSearchResult[] = take(ranked.lessons).map(({ lesson, best, hits, score }) => ({
    kind: 'lesson', date: lesson.date, day: lesson.day, title: lesson.title, section: best.section, anchor: best.anchor,
    readingMode: best.readingMode, label: best.label, snippet: makeSnippet(best.text, query), score, hits,
  }))
  const compoundResults: CompoundSearchResult[] = take(ranked.compounds).map(({ item: { series, entries, fields } }) => {
    const entry = entries.find(item => prepared.terms.some(term => normalizeSearchText(item.word).includes(term) || normalizeSearchText(item.reading).includes(term)))
    return { kind: 'compound', seriesId: series.id, title: series.title,
      label: entry ? `${entry.word} · ${entry.reading}` : series.subtitle, snippet: bestSnippet(fields, ranked!.query) }
  })
  const liveResults: LiveSearchResult[] = take(ranked.live).map(({ item: { unit, group, fields } }) => ({
    kind: 'live', unitId: unit.id, groupId: group.id, date: unit.date, title: group.title, label: unit.title,
    snippet: bestSnippet(fields, ranked!.query),
  }))
  return [
    { kind: 'lesson', label: '每日教材', results: lessonResults, total: ranked.lessons.length },
    { kind: 'compound', label: '复合动词', results: compoundResults, total: ranked.compounds.length },
    { kind: 'live', label: '直播笔记', results: liveResults, total: ranked.live.length },
  ].filter(group => group.results.length) as SearchResultGroup[]
}
