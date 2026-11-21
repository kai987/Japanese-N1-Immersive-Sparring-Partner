import type { ReadingMode, SectionId } from '../types.ts'
import type { LessonSearchIndex, PreparedField, ProjectNotesIndex } from './projectSearch.ts'
import { normalizeSearchText } from './searchHighlight.ts'

type ChunkRow = [section: number, anchor: number, label: number, text: number, priority: number, normalized: number, mode: number | null]
export interface PackedLessonSearchIndex {
  version: 2
  strings: string[]
  lessons: [date: string, day: number, title: number, chunks: ChunkRow[]][]
}

function stringTable() {
  const strings: string[] = [], ids = new Map<string, number>()
  return { strings, add(text: string) {
    let id = ids.get(text)
    if (id === undefined) { id = strings.length; strings.push(text); ids.set(text, id) }
    return id
  } }
}

/** Identical review text is stored once; normalized fields stay build-prepared. */
export function packLessonSearchIndex(index: LessonSearchIndex): PackedLessonSearchIndex {
  const { strings, add } = stringTable()
  return { version: 2, strings, lessons: index.map(({ lesson, chunks }) => [lesson.date, lesson.day, add(lesson.title),
    chunks.map(chunk => [add(chunk.section), add(chunk.anchor), add(chunk.label), add(chunk.text), chunk.priority,
      add(chunk.normalized), chunk.readingMode ? add(chunk.readingMode) : null])]) }
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
function tableReader(value: unknown) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error('Invalid search string table')
  const strings = value as string[]
  return (id: unknown) => {
    if (!Number.isSafeInteger(id) || (id as number) < 0 || (id as number) >= strings.length) throw new Error('Invalid search string reference')
    return strings[id as number]
  }
}

/** Legacy payloads remain readable for retained releases and verification tools. */
export function decodeLessonSearchIndex(value: unknown): LessonSearchIndex {
  if (Array.isArray(value)) {
    if (value.some(row => !isRecord(row) || !isRecord(row.lesson) || typeof row.lesson.date !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(row.lesson.date) || !Number.isSafeInteger(row.lesson.day) || (row.lesson.day as number) < 1
      || typeof row.lesson.title !== 'string' || !Array.isArray(row.chunks)
      || row.chunks.some(chunk => !isRecord(chunk) || ['text', 'normalized', 'compact'].some(key => typeof chunk[key] !== 'string')))) {
      throw new Error('Invalid legacy search index')
    }
    return value as LessonSearchIndex
  }
  if (!isRecord(value) || value.version !== 2 || !Array.isArray(value.lessons)) throw new Error('Invalid search index')
  const text = tableReader(value.strings)
  return value.lessons.map(row => {
    if (!Array.isArray(row) || row.length !== 4 || typeof row[0] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row[0])
      || !Number.isSafeInteger(row[1]) || row[1] < 1 || !Array.isArray(row[3])) throw new Error('Invalid search lesson')
    return { lesson: { date: row[0], day: row[1], title: text(row[2]) }, chunks: row[3].map((chunk: unknown) => {
      if (!Array.isArray(chunk) || chunk.length !== 7 || !Number.isFinite(chunk[4])) throw new Error('Invalid search chunk')
      const section = text(chunk[0]), mode = chunk[6] === null ? undefined : text(chunk[6])
      if (!['today', 'vocabulary', 'grammar', 'immersion', 'reading'].includes(section)
        || (mode !== undefined && !['japanese', 'bilingual', 'analysis'].includes(mode))) throw new Error('Invalid search destination')
      const normalized = text(chunk[5])
      return { section: section as SectionId, anchor: text(chunk[1]), label: text(chunk[2]), text: text(chunk[3]), priority: chunk[4],
        normalized, compact: normalized.replace(/\s+/g, ''), ...(mode ? { readingMode: mode as ReadingMode } : {}) }
    }) }
  })
}

type CompoundRow = [id: string, title: number, subtitle: number, entries: [number, number][], fields: number[], searchable: number[], words: number[], heading: number[]]
type LiveRow = [unit: string, date: string, unitTitle: number, group: string, title: number, order: number, fields: number[], words: number[], heading: number[]]
export interface PackedProjectNotesIndex { version: 1; strings: string[]; compounds: CompoundRow[]; live: LiveRow[] }

/** Small search-only projection keeps offline note candidates without shipping complete lessons. */
export function packProjectNotesIndex(notes: ProjectNotesIndex): PackedProjectNotesIndex {
  const { strings, add } = stringTable()
  const refs = (items: PreparedField[]) => items.map(field => add(field.text))
  return { version: 1, strings,
    compounds: notes.compounds.map(item => [item.series.id, add(item.series.title), add(item.series.subtitle),
      item.entries.map(entry => [add(entry.word), add(entry.reading)]), refs(item.fields), refs(item.searchable), refs(item.words), refs(item.title)]),
    live: notes.live.map(item => [item.unit.id, item.unit.date, add(item.unit.title), item.group.id, add(item.group.title), item.order,
      refs(item.fields), refs(item.words), refs(item.title)]) }
}

export function decodeProjectNotesIndex(value: PackedProjectNotesIndex): ProjectNotesIndex {
  if (value.version !== 1) throw new Error('Invalid note search index')
  const text = tableReader(value.strings)
  const fields = new Map<number, PreparedField>()
  const refs = (ids: number[]) => ids.map(id => {
    let field = fields.get(id)
    if (!field) { const original = text(id); field = { text: original, normalized: normalizeSearchText(original) }; fields.set(id, field) }
    return field
  })
  return {
    compounds: value.compounds.map((row, order) => ({ series: { id: row[0], title: text(row[1]), subtitle: text(row[2]) }, order,
      entries: row[3].map(pair => ({ word: text(pair[0]), reading: text(pair[1]) })), fields: refs(row[4]), searchable: refs(row[5]), words: refs(row[6]), title: refs(row[7]) })),
    live: value.live.map(row => ({ unit: { id: row[0], date: row[1], title: text(row[2]) }, group: { id: row[3], title: text(row[4]) },
      order: row[5], fields: refs(row[6]), words: refs(row[7]), title: refs(row[8]) })),
  }
}
