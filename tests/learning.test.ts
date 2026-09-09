import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeProgress, decodeCompleted, decodeTheme, initialProgress, recordStudy, streakFor, tokyoDate } from '../src/lib/progress.ts'
import { readingChoices } from '../src/lib/reading.ts'
import { lessons } from '../src/data/history-legacy.ts'
import { mergeArchives, validateArchive } from '../src/lib/archive.ts'

function daily(date = '2026-09-10') {
  const lesson = structuredClone(lessons[0])
  lesson.date = date
  lesson.day = (Date.parse(date) - Date.parse('2026-08-30')) / 86400000 + 1
  for (const item of [...lesson.vocabulary, ...lesson.grammar, lesson.reading.question]) item.id = `${date}-${item.id}`
  return { lesson, reviewFocus: [], merged: false }
}

test('legacy progress keeps answers and valid statuses, and discards invented streak', () => {
  const migrated = decodeProgress({ vocab: { a: 'mastered', b: 'review' }, grammar: {}, readingAnswers: { q: 0 }, streak: 11, minutesThisWeek: 164 })
  assert.equal(migrated.recovered, false)
  assert.deepEqual(migrated.value.vocab, { a: 'mastered', b: 'review' })
  assert.equal(migrated.value.readingAnswers.q, 0)
  assert.deepEqual(migrated.value.readingAttempts.q, [{ answer: 0, at: null }])
  assert.equal(streakFor(migrated.value.studyDates, '2026-09-09'), 0)
})
test('damaged storage is repaired without losing valid entries', () => {
  for (const value of [null, [], {}, 42]) assert.equal(decodeProgress(value).recovered, true)
  const repaired = decodeProgress({ vocab: { good: 'mastered', bad: 'oops' }, grammar: null, readingAnswers: { good: 2, bad: -1 } })
  assert.deepEqual(repaired.value.vocab, { good: 'mastered' })
  assert.deepEqual(repaired.value.readingAnswers, { good: 2 })
  assert.deepEqual(decodeTheme('wrong'), { value: 'light', recovered: true })
  assert.deepEqual(decodeCompleted({ '2026-09-09': true, '2026-02-30': true, other: 'yes' }).value, { '2026-09-09': true })
})
test('Tokyo midnight, duplicate actions, missed days and yesterday grace', () => {
  assert.equal(tokyoDate(new Date('2026-09-09T14:59:59Z')), '2026-09-09')
  assert.equal(tokyoDate(new Date('2026-09-09T15:00:00Z')), '2026-09-10')
  const progress = recordStudy(recordStudy(initialProgress, '2026-09-09'), '2026-09-09')
  assert.deepEqual(progress.studyDates, ['2026-09-09'])
  assert.equal(streakFor(['2026-09-08', '2026-09-09'], '2026-09-10'), 2)
  assert.equal(streakFor(['2026-09-08', '2026-09-10'], '2026-09-10'), 1)
  assert.equal(streakFor(['2026-09-08'], '2026-09-10'), 0)
  assert.equal(streakFor(['2026-09-11'], '2026-09-10'), 0)
})
test('all eleven lessons distribute answers while retaining canonical indexes and notes', () => {
  const positions = new Set<number>()
  for (const lesson of lessons) {
    const q = lesson.reading.question
    const choices = readingChoices(q, lesson.day)
    assert.deepEqual(choices, readingChoices(q, lesson.day))
    assert.equal(new Set(choices.map(c => c.index)).size, 4)
    for (const choice of choices) {
      assert.equal(choice.text, q.options[choice.index])
      assert.equal(choice.note, q.optionNotes[choice.index])
    }
    positions.add(choices.findIndex(c => c.index === q.answer))
  }
  assert.equal(positions.size, 4)
})
test('valid daily file is merged once and overrides the same date', () => {
  const file = daily()
  assert.equal(mergeArchives(lessons, { '2026-09-10.json': file }).lessons.length, 12)
  const replacement = daily('2026-09-09')
  replacement.lesson.title = '差し替え'
  const catalog = mergeArchives(lessons, { '2026-09-09.json': replacement })
  assert.equal(catalog.lessons.length, 11)
  assert.equal(catalog.lessons[0].title, '差し替え')
})
test('invalid daily archives fail with the file and field in the error', () => {
  const missing = daily(); Reflect.deleteProperty(missing.lesson, 'vocabulary')
  assert.throws(() => validateArchive(missing, '2026-09-10.json'), /2026-09-10.json.lesson.vocabulary/)
  const paragraphs = daily(); paragraphs.lesson.immersion.translations.pop()
  assert.throws(() => validateArchive(paragraphs, '2026-09-10.json'), /段落数/)
  const answer = daily(); answer.lesson.reading.question.answer = 4
  assert.throws(() => validateArchive(answer, '2026-09-10.json'), /question.answer/)
  const duplicate = daily(); duplicate.lesson.grammar[0].id = duplicate.lesson.vocabulary[0].id
  assert.throws(() => validateArchive(duplicate, '2026-09-10.json'), /ID が重複/)
  assert.throws(() => validateArchive(daily(), '2026-09-11.json'), /ファイル名/)
  const date = daily(); date.lesson.date = '2026-02-30'
  assert.throws(() => validateArchive(date, '2026-02-30.json'), /lesson.date/)
  const day = daily(); day.lesson.day = 99
  assert.throws(() => validateArchive(day, '2026-09-10.json'), /lesson.day/)
  const id = daily(); id.lesson.vocabulary[0].id = 'undated'
  assert.throws(() => validateArchive(id, '2026-09-10.json'), /各 ID/)
})
test('duplicate IDs across days and duplicate generated dates fail', () => {
  const cloned = structuredClone(lessons)
  cloned[1].vocabulary[0].id = cloned[0].vocabulary[0].id
  assert.throws(() => mergeArchives(cloned, {}), /重複/)
  assert.throws(() => mergeArchives(lessons, { 'a/2026-09-10.json': daily(), 'b/2026-09-10.json': daily() }), /複数/)
})

test('import command updates one file and rejects invalid replacements without damaging it', async () => {
  const { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { importDaily } = await import('../scripts/import-daily.ts')
  const folder = mkdtempSync(join(tmpdir(), 'n1-import-test-'))
  try {
    const source = join(folder, '2026-09-10.json')
    const destination = join(folder, 'daily')
    const entry = daily()
    writeFileSync(source, JSON.stringify(entry))
    const imported = importDaily(source, destination)
    entry.lesson.title = '更新済み'
    writeFileSync(source, JSON.stringify(entry))
    importDaily(source, destination)
    assert.deepEqual(readdirSync(destination), ['2026-09-10.json'])
    assert.equal(JSON.parse(readFileSync(imported, 'utf8')).lesson.title, '更新済み')
    entry.lesson.reading.question.answer = 99
    writeFileSync(source, JSON.stringify(entry))
    assert.throws(() => importDaily(source, destination), /question.answer/)
    assert.equal(JSON.parse(readFileSync(imported, 'utf8')).lesson.reading.question.answer, 2)
  } finally { rmSync(folder, { recursive: true }) }
})
