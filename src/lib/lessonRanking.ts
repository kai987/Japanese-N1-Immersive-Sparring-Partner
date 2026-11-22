import type { IndexedSearchChunk, LessonSearchIndex, LessonSearchRecord, PreparedQuery } from './projectSearch.ts'

export interface RankedLesson { lesson: LessonSearchRecord['lesson']; best: IndexedSearchChunk; score: number; hits: number }

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

export function rankLessons(query: PreparedQuery, index: LessonSearchIndex): RankedLesson[] {
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
  return lessons
}
