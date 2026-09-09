import type { DailyLesson } from '../types.ts'
import { isDate, isRecord } from './progress.ts'

export type ReviewFocus = { type: '词汇' | '文法' | '读解' | '語彙' | '読解'; title: string; detail: string }
export type DailyArchiveFile = { lesson: DailyLesson; reviewFocus?: ReviewFocus[]; merged?: boolean }
function requireValid(ok: unknown, path: string, message: string): asserts ok {
  if (!ok) throw new Error(`${path}: ${message}`)
}
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string' && v.trim())
function fields(value: unknown, names: string[], path: string): asserts value is Record<string, unknown> {
  requireValid(isRecord(value), path, 'オブジェクトが必要です')
  for (const name of names) requireValid(typeof value[name] === 'string' && value[name].trim(), `${path}.${name}`, '空でない文字列が必要です')
}
export function validateLesson(input: unknown, path: string, datedIds = false): asserts input is DailyLesson {
  fields(input, ['date', 'title', 'subtitle'], path)
  requireValid(isDate(input.date), `${path}.date`, '有効な YYYY-MM-DD が必要です')
  const expectedDay = (Date.parse(input.date) - Date.parse('2026-08-30')) / 86400000 + 1
  requireValid(Number.isInteger(input.day) && input.day === expectedDay && expectedDay > 0 && expectedDay <= 99, `${path}.day`, `開始日からの日数（${expectedDay}）と一致する必要があります`)
  requireValid(typeof input.estimatedMinutes === 'number' && Number.isFinite(input.estimatedMinutes) && input.estimatedMinutes > 0, `${path}.estimatedMinutes`, '正の数が必要です')
  fields(input.immersion, ['title'], `${path}.immersion`)
  for (const name of ['paragraphs', 'translations', 'analysis']) requireValid(strings(input.immersion[name]), `${path}.immersion.${name}`, '空でない文字列配列が必要です')
  const immersion = input.immersion as { paragraphs: string[]; translations: string[]; analysis: string[] }
  requireValid(immersion.paragraphs.length === immersion.translations.length && immersion.paragraphs.length === immersion.analysis.length, `${path}.immersion`, '本文・対訳・解説の段落数が一致しません')
  for (const [kind, names] of [
    ['vocabulary', ['id', 'word', 'reading', 'meaning', 'partOfSpeech', 'example', 'translation', 'nuance']],
    ['grammar', ['id', 'pattern', 'meaning', 'form', 'register', 'explanation', 'example', 'translation', 'comparison']],
  ] as const) {
    const items = input[kind]
    requireValid(Array.isArray(items) && items.length > 0, `${path}.${kind}`, '1件以上の配列が必要です')
    items.forEach((item, index) => {
      const itemPath = `${path}.${kind}[${index}]`
      fields(item, [...names], itemPath)
      if (kind === 'vocabulary') {
        requireValid(item.jlpt === 'N1', `${itemPath}.jlpt`, 'N1 が必要です')
        requireValid(strings(item.collocations), `${itemPath}.collocations`, '組み合わせの配列が必要です')
      } else requireValid(Number.isInteger(item.frequency) && Number(item.frequency) >= 1 && Number(item.frequency) <= 5, `${itemPath}.frequency`, '1〜5の整数が必要です')
    })
  }
  fields(input.reading, ['title'], `${path}.reading`)
  requireValid(strings(input.reading.paragraphs), `${path}.reading.paragraphs`, '本文の配列が必要です')
  const q = input.reading.question
  fields(q, ['id', 'prompt', 'explanation'], `${path}.reading.question`)
  requireValid(strings(q.options) && q.options.length === 4 && new Set(q.options).size === 4, `${path}.reading.question.options`, '異なる4つの選択肢が必要です')
  requireValid(Number.isInteger(q.answer) && Number(q.answer) >= 0 && Number(q.answer) < 4, `${path}.reading.question.answer`, '0〜3の整数が必要です')
  requireValid(strings(q.optionNotes) && q.optionNotes.length === 4, `${path}.reading.question.optionNotes`, '選択肢に対応する4つの解説が必要です')
  const ids = [...(input.vocabulary as {id:string}[]), ...(input.grammar as {id:string}[]), q].map(item => String(item.id))
  requireValid(new Set(ids).size === ids.length, path, 'ID が重複しています')
  if (datedIds) requireValid(ids.every(id => id.startsWith(`${input.date}-`)), path, '各 ID は日付とハイフンで始めてください')
}
export function validateArchive(input: unknown, filename: string): DailyArchiveFile {
  requireValid(isRecord(input), filename, 'オブジェクトが必要です')
  validateLesson(input.lesson, `${filename}.lesson`, true)
  const basename = filename.split('/').at(-1)
  requireValid(basename === `${input.lesson.date}.json`, filename, 'ファイル名と lesson.date が一致しません')
  requireValid(input.merged === undefined || typeof input.merged === 'boolean', `${filename}.merged`, '真偽値が必要です')
  if (input.reviewFocus !== undefined) {
    requireValid(Array.isArray(input.reviewFocus), `${filename}.reviewFocus`, '配列が必要です')
    input.reviewFocus.forEach((item, index) => {
      fields(item, ['type', 'title', 'detail'], `${filename}.reviewFocus[${index}]`)
      requireValid(['词汇', '文法', '读解', '語彙', '読解'].includes(String(item.type)), `${filename}.reviewFocus[${index}].type`, '語彙・文法・読解のいずれかが必要です')
    })
  }
  return input as DailyArchiveFile
}
export function mergeArchives(legacy: DailyLesson[], modules: Record<string, unknown>) {
  const generated = Object.entries(modules).map(([filename, input]) => validateArchive(input, filename))
  const byDate = new Map(legacy.map(lesson => [lesson.date, lesson]))
  const generatedDates = new Set<string>()
  for (const entry of generated) {
    requireValid(!generatedDates.has(entry.lesson.date), entry.lesson.date, '同じ日付のファイルが複数あります')
    generatedDates.add(entry.lesson.date)
    byDate.set(entry.lesson.date, entry.lesson)
  }
  const lessons = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date))
  const seen = new Map<string, string>()
  for (const lesson of lessons) {
    validateLesson(lesson, lesson.date)
    for (const { id } of [...lesson.vocabulary, ...lesson.grammar, lesson.reading.question]) {
      requireValid(!seen.has(id), lesson.date, `ID ${id} は ${seen.get(id)} と重複しています`)
      seen.set(id, lesson.date)
    }
  }
  return { generated, lessons, byDate }
}
