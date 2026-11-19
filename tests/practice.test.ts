import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import policy from '../docs/automation/policy.json' with { type: 'json' }
import type { DailyLesson, DailyPractice, PracticeCategory, PracticeKind } from '../src/types.ts'
import { lessons } from '../src/data/history-legacy.ts'
import { mergeArchives, validateLesson } from '../src/lib/archive.ts'
import { getAllLessonQuestions, getPracticeQuestions, validatePractice, validatePracticeCoverage } from '../src/lib/practice.ts'
import { questionElementId } from '../src/lib/questionReview.ts'
import { createLessonSearchIndex, searchProject } from '../src/lib/projectSearch.ts'
import { validatePracticeSource } from '../scripts/lib/practiceSource.ts'
import { validateContent } from '../scripts/validate-content.ts'

const date = '2026-09-10'
function fixture(): DailyPractice {
  const counts: [PracticeKind, number][] = [
    ['vocabulary', policy.practice.vocabularyQuestions], ['grammar', policy.practice.grammarQuestions],
    ['short', policy.practice.readingQuestions.short], ['medium', policy.practice.readingQuestions.medium],
    ['long', policy.practice.readingQuestions.longMaximum], ['comparison', policy.practice.readingQuestions.comparison],
    ['information', policy.practice.readingQuestions.information],
  ]
  return { schemaVersion: 1, date, day: 12, title: '分類練習', sourceNote: '形式を参照したオリジナル練習',
    formatSources: ['https://www.jlpt.jp/guideline/pdf/n1.pdf'], sourcePath: `n1-source/revisions/${date}-practice.md`, estimatedMinutes: 55,
    groups: counts.map(([kind, count]) => ({ id: `${date}-group-${kind}`, category: (kind === 'vocabulary' || kind === 'grammar' ? kind : 'reading') as PracticeCategory,
      kind, title: kind, instructions: '一つ選びなさい。', paragraphs: ['出題に必要な条件を示した本文です。'],
      questions: Array.from({ length: count }, (_, index) => ({ id: `${date}-practice-${kind}-${index}`, prompt: `問題-${kind}-${index}`,
        options: ['案内された条件に合う。', '記載と逆の条件である。', '記載のない条件である。', '対象の異なる条件である。'],
        answer: index % 4, explanation: `unsubmitted-secret-${kind}-${index}`, optionNotes: ['解説い', '解説ろ', '解説は', '解説に'] })) })) }
}
function daily(): DailyLesson {
  const lesson = structuredClone(lessons[0])
  lesson.date = date; lesson.day = 12
  for (const item of [...lesson.vocabulary, ...lesson.grammar, lesson.reading.question]) item.id = `${date}-${item.id}`
  return lesson
}

test('shared-policy coverage rejects single-question fallback from the start date but preserves earlier lessons and light exam day', () => {
  const shift = (value: string, days: number) => new Date(Date.parse(value) + days * 86_400_000).toISOString().slice(0, 10)
  const lessonFor = (targetDate: string) => {
    const lesson = daily()
    lesson.date = targetDate
    lesson.day = (Date.parse(targetDate) - Date.parse(policy.planStart)) / 86_400_000 + 1
    for (const item of [...lesson.vocabulary, ...lesson.grammar, lesson.reading.question]) item.id = item.id.replace(date, targetDate)
    return lesson
  }
  assert.doesNotThrow(() => validatePracticeCoverage([lessonFor(shift(policy.practice.requiredFrom, -1))]))
  assert.doesNotThrow(() => validatePracticeCoverage([lessonFor(policy.planEnd)]))
  for (const targetDate of [policy.practice.requiredFrom, shift(policy.practice.requiredFrom, 1), shift(policy.planEnd, -1)]) {
    const lesson = lessonFor(targetDate)
    assert.throws(() => validatePracticeCoverage([lesson]), /required practice is missing/)
    const practice = fixture()
    practice.date = targetDate; practice.day = lesson.day
    practice.sourcePath = practice.sourcePath.replace(date, targetDate)
    for (const group of practice.groups) {
      group.id = group.id.replace(date, targetDate)
      for (const question of group.questions) question.id = question.id.replace(date, targetDate)
    }
    // Coverage is checked on the merged lesson, allowing the approved Day82
    // overlay while refusing a future raw lesson with only its legacy question.
    const merged = mergeArchives([], { [`${targetDate}.json`]: { lesson } }, { [`${targetDate}.json`]: practice })
    assert.doesNotThrow(() => validatePracticeCoverage(merged.lessons))
    const incomplete = structuredClone(merged.lessons)
    incomplete[0].practice!.groups[0].questions.pop()
    assert.throws(() => validatePracticeCoverage(incomplete), /語彙問題/)
  }
})

test('practice validates every category against the shared policy and rejects broken answer contracts', () => {
  validatePractice(fixture(), 'practice')
  const fewerLong = fixture()
  fewerLong.groups.find(group => group.kind === 'long')!.questions.splice(policy.practice.readingQuestions.longMinimum)
  validatePractice(fewerLong, 'practice')
  for (const breakFixture of [
    (p: DailyPractice) => { p.groups[0].questions.pop() },
    (p: DailyPractice) => { p.groups[0].category = 'reading' },
    (p: DailyPractice) => { p.groups[0].questions[0].answer = 4 },
    (p: DailyPractice) => { p.groups[0].questions[0].options[1] = p.groups[0].questions[0].options[0] },
    (p: DailyPractice) => { p.groups[0].questions[0].optionNotes.pop() },
    (p: DailyPractice) => { p.groups[1].questions[0].id = p.groups[0].questions[0].id },
    (p: DailyPractice) => { p.sourcePath = '../private.json' },
    (p: DailyPractice) => { p.date = '2026-12-07'; p.day = 100 },
  ]) {
    const broken = fixture(); breakFixture(broken)
    assert.throws(() => validatePractice(broken, 'practice'))
  }
})

test('approved overlays preserve raw lessons and legacy answer identities and reject conflicting or orphan revisions', () => {
  const original = daily(), snapshot = structuredClone(original), practice = fixture()
  const catalog = mergeArchives([], { [`${date}.json`]: { lesson: original } }, { [`${date}.json`]: practice })
  assert.deepEqual(original, snapshot)
  const updated = catalog.byDate.get(date)!
  assert.deepEqual(updated.reading, original.reading)
  assert.equal(getPracticeQuestions(updated).length, practice.groups.flatMap(group => group.questions).length)
  assert.equal(getAllLessonQuestions(updated).length, getPracticeQuestions(updated).length + 1)
  assert.deepEqual(getAllLessonQuestions(updated)[0].question, snapshot.reading.question)
  assert.deepEqual(getPracticeQuestions(snapshot), [{ question: snapshot.reading.question, category: 'reading' }])
  assert.throws(() => mergeArchives([], {}, { [`${date}.json`]: practice }), /既存教材/)
  assert.throws(() => mergeArchives([], { [`${date}.json`]: { lesson: updated } }, { [`${date}.json`]: practice }), /複数/)
  const duplicate = structuredClone(updated)
  duplicate.practice!.groups[0].questions[0].id = duplicate.vocabulary[0].id
  assert.throws(() => validateLesson(duplicate, date, true), /ID が重複/)
})

test('public source must contain the complete question, option, paragraph and table content', () => {
  const folder = mkdtempSync(join(tmpdir(), 'n1-practice-source-'))
  const practice = fixture()
  practice.groups.at(-1)!.table = { caption: '受付一覧', headers: ['会場', '締切'], rows: [['京都', '前日正午']] }
  const source = [`# Day 12｜${date} 学習修訂`, ...practice.groups.flatMap(group => [group.title, group.instructions, ...group.paragraphs,
    ...(group.table ? [group.table.caption, ...group.table.headers, ...group.table.rows.flat()] : []),
    ...group.questions.flatMap(q => [q.prompt, ...q.options])])].join('\n')
  const path = join(folder, practice.sourcePath)
  try {
    mkdirSync(join(folder, 'n1-source/revisions'), { recursive: true })
    writeFileSync(path, source)
    const root = pathToFileURL(`${folder}/`)
    assert.equal(validatePracticeSource(practice, root), source)
    writeFileSync(path, source.replaceAll('前日正午', '当日正午'))
    assert.throws(() => validatePracticeSource(practice, root), /complete practice text missing/)
    writeFileSync(path, source.replace('Day 12', 'Day 13'))
    assert.throws(() => validatePracticeSource(practice, root), /date\/Day mismatch/)
  } finally { rmSync(folder, { recursive: true, force: true }) }
})

test('question search opens the classified question and never indexes hidden answer explanations', () => {
  const lesson = { ...daily(), practice: fixture() }
  const index = createLessonSearchIndex([lesson], { [date]: [{ type: '語彙', title: '補充ターゲット', detail: '未回答の復習考点です。' }] })
  const q = lesson.practice.groups[0].questions[0]
  const result = searchProject(q.prompt, index, { limit: null }).find(group => group.kind === 'lesson')!.results[0]
  assert.equal(result.kind, 'lesson')
  if (result.kind === 'lesson') {
    assert.equal(result.section, 'vocabulary')
    assert.equal(result.anchor, questionElementId(q.id))
  }
  assert.ok(!index[0].chunks.some(chunk => chunk.text.includes('unsubmitted-secret')))
  const passage = index[0].chunks.find(chunk => chunk.anchor === lesson.practice.groups[0].id)!
  assert.ok(passage.text.includes(lesson.practice.groups[0].paragraphs[0]))
  assert.equal(passage.section, 'vocabulary')
  const focus = index[0].chunks.find(chunk => chunk.anchor === 'review-0')!
  assert.equal(focus.section, 'today')
  assert.match(focus.label, /補充知識/)
})

test('Day82 revision is delivered through verified lesson data while the saved original reading stays intact', () => {
  const lesson = validateContent().byDate.get('2026-11-19')!
  const original = JSON.parse(readFileSync(new URL('../src/data/daily/2026-11-19.json', import.meta.url), 'utf8')).lesson
  assert.ok(lesson.practice, 'Day82 approved practice revision must be present')
  assert.deepEqual(lesson.reading, original.reading)
  const references = getPracticeQuestions(lesson)
  for (const category of ['vocabulary', 'grammar'] as const) {
    assert.equal(references.filter(item => item.category === category).length,
      category === 'vocabulary' ? policy.practice.vocabularyQuestions : policy.practice.grammarQuestions)
  }
  assert.equal(new Set(getAllLessonQuestions(lesson).map(item => item.question.id)).size, references.length + 1)
})
