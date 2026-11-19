import policy from '../../docs/automation/policy.json' with { type: 'json' }
import type { DailyLesson, DailyPractice, PracticeCategory, PracticeGroup, PracticeKind, ReadingQuestion } from '../types.ts'
import { isDate, isRecord } from './progress.ts'

export const practiceCategoryLabels: Record<PracticeCategory, string> = {
  vocabulary: '語彙', grammar: '文法', reading: '読解',
}
export const practiceKindLabels: Record<PracticeKind, string> = {
  vocabulary: '語彙問題', grammar: '文法問題', short: '短文読解', medium: '中篇読解',
  long: '長文読解', comparison: '比較読解', information: '情報検索',
}
export interface PracticeQuestionReference {
  question: ReadingQuestion
  category: PracticeCategory
  group?: PracticeGroup
}

/** Active exercises; the original single question remains an archived identity. */
export function getPracticeQuestions(lesson: DailyLesson): PracticeQuestionReference[] {
  return lesson.practice
    ? lesson.practice.groups.flatMap(group => group.questions.map(question => ({ question, category: group.category, group })))
    : [{ question: lesson.reading.question, category: 'reading' }]
}

/** Includes retired questions so old answers keep their original interpretation. */
export function getAllLessonQuestions(lesson: DailyLesson): PracticeQuestionReference[] {
  return lesson.practice
    ? [{ question: lesson.reading.question, category: 'reading' }, ...getPracticeQuestions(lesson)]
    : getPracticeQuestions(lesson)
}

/** Run after approved overlays are merged; older lessons and exam day stay light. */
export function validatePracticeCoverage(lessons: DailyLesson[]) {
  const { requiredFrom } = policy.practice
  requireValid(isDate(requiredFrom) && requiredFrom >= policy.planStart && requiredFrom < policy.planEnd,
    'policy.practice.requiredFrom', '計画期間内の練習適用開始日が必要です')
  for (const lesson of lessons) {
    const required = lesson.date >= requiredFrom && lesson.date < policy.planEnd
    requireValid(!required || lesson.practice !== undefined, `${lesson.date}.practice`, 'required practice is missing; single-question fallback is not permitted after the shared-policy start date')
    if (lesson.practice !== undefined) validatePractice(lesson.practice, `${lesson.date}.practice`, lesson.date, lesson.day)
  }
}

function requireValid(ok: unknown, path: string, message: string): asserts ok {
  if (!ok) throw new Error(`${path}: ${message}`)
}
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const strings = (value: unknown, allowEmpty = false): value is string[] =>
  Array.isArray(value) && (allowEmpty || value.length > 0) && value.every(text)
const fields = (value: unknown, names: string[], path: string): Record<string, unknown> => {
  requireValid(isRecord(value), path, 'オブジェクトが必要です')
  for (const name of names) requireValid(text(value[name]), `${path}.${name}`, '空でない文字列が必要です')
  return value
}

export function validatePracticeQuestion(input: unknown, path: string): asserts input is ReadingQuestion {
  const q = fields(input, ['id', 'prompt', 'explanation'], path)
  requireValid(strings(q.options) && q.options.length === 4 && new Set(q.options).size === 4,
    `${path}.options`, '異なる4つの選択肢が必要です')
  requireValid(Number.isInteger(q.answer) && Number(q.answer) >= 0 && Number(q.answer) < 4,
    `${path}.answer`, '0〜3の整数が必要です')
  requireValid(strings(q.optionNotes) && q.optionNotes.length === 4,
    `${path}.optionNotes`, '選択肢に対応する4つの解説が必要です')
  if (q.questionType !== undefined) requireValid(text(q.questionType), `${path}.questionType`, '空でない題型が必要です')
}

/** Counts come only from the shared authoring policy, never a second UI quota. */
export function validatePractice(input: unknown, path: string, expectedDate?: string, expectedDay?: number): asserts input is DailyPractice {
  const value = fields(input, ['date', 'title', 'sourceNote', 'sourcePath'], path)
  requireValid(value.schemaVersion === 1, `${path}.schemaVersion`, 'schemaVersion 1 が必要です')
  requireValid(isDate(value.date) && value.date >= policy.planStart && value.date <= policy.planEnd,
    `${path}.date`, '計画期間内の有効な日付が必要です')
  const day = (Date.parse(value.date) - Date.parse(policy.planStart)) / 86400000 + 1
  requireValid(value.day === day && (!expectedDate || value.date === expectedDate) && (expectedDay === undefined || day === expectedDay),
    `${path}.day`, '教材の日付・Dayと一致する必要があります')
  requireValid(typeof value.estimatedMinutes === 'number' && Number.isFinite(value.estimatedMinutes) && value.estimatedMinutes > 0,
    `${path}.estimatedMinutes`, '正の学習時間が必要です')
  requireValid(strings(value.formatSources) && value.formatSources.every(url => {
    try { return new URL(url).protocol === 'https:' } catch { return false }
  }), `${path}.formatSources`, '検証した公式形式のHTTPS参照URLが必要です')
  requireValid(new RegExp(`^n1-source/(?:revisions/)?${value.date}(?:-[a-z0-9-]+)?\\.md$`).test(String(value.sourcePath)),
    `${path}.sourcePath`, '同じ日付の公開原稿か明示的な修訂原稿が必要です')
  requireValid(Array.isArray(value.groups) && value.groups.length > 0, `${path}.groups`, '分類された練習が必要です')
  const ids = new Set<string>()
  const counts: Record<PracticeKind, number> = { vocabulary: 0, grammar: 0, short: 0, medium: 0, long: 0, comparison: 0, information: 0 }
  for (const [i, raw] of value.groups.entries()) {
    const groupPath = `${path}.groups[${i}]`
    const group = fields(raw, ['id', 'category', 'kind', 'title', 'instructions'], groupPath)
    requireValid(typeof group.kind === 'string' && Object.hasOwn(counts, group.kind), `${groupPath}.kind`, '有効な分類が必要です')
    const kind = group.kind as PracticeKind
    const category: PracticeCategory = kind === 'vocabulary' || kind === 'grammar' ? kind : 'reading'
    requireValid(group.category === category, `${groupPath}.category`, '題型と分類が一致していません')
    requireValid(String(group.id).startsWith(`${value.date}-`) && !ids.has(String(group.id)), `${groupPath}.id`, '日付を含む一意のIDが必要です')
    ids.add(String(group.id))
    requireValid(strings(group.paragraphs, category !== 'reading'), `${groupPath}.paragraphs`, '本文の文字列配列が必要です')
    if (group.table !== undefined) {
      const table = fields(group.table, ['caption'], `${groupPath}.table`)
      requireValid(strings(table.headers) && Array.isArray(table.rows) && table.rows.length > 0 &&
        table.rows.every(row => strings(row) && row.length === (table.headers as string[]).length),
      `${groupPath}.table`, '表の見出しと各行の列数を一致させてください')
    }
    requireValid(Array.isArray(group.questions) && group.questions.length > 0, `${groupPath}.questions`, '問題が必要です')
    counts[kind] += group.questions.length
    group.questions.forEach((question, index) => {
      validatePracticeQuestion(question, `${groupPath}.questions[${index}]`)
      requireValid(question.id.startsWith(`${value.date}-`) && !ids.has(question.id), `${groupPath}.questions[${index}].id`, '日付を含む一意のIDが必要です')
      ids.add(question.id)
    })
  }
  const target = policy.practice
  requireValid(counts.vocabulary === target.vocabularyQuestions, `${path}.groups`, `語彙問題は共有方針の${target.vocabularyQuestions}問が必要です`)
  requireValid(counts.grammar === target.grammarQuestions, `${path}.groups`, `文法問題は共有方針の${target.grammarQuestions}問が必要です`)
  for (const kind of ['short', 'medium', 'comparison', 'information'] as const) {
    requireValid(counts[kind] === target.readingQuestions[kind], `${path}.groups`, `${kind}問題は共有方針の${target.readingQuestions[kind]}問が必要です`)
  }
  requireValid(counts.long >= target.readingQuestions.longMinimum && counts.long <= target.readingQuestions.longMaximum,
    `${path}.groups`, '長文問題数は共有方針の範囲内である必要があります')
}
