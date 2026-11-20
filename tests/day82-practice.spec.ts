import { test, expect, type Page } from '@playwright/test'
import { validateContent } from '../scripts/validate-content.ts'
import { getPracticeQuestions } from '../src/lib/practice.ts'
import { practiceHref, questionElementId } from '../src/lib/questionReview.ts'
import type { PracticeCategory, ReadingQuestion, StoredProgress } from '../src/types.ts'

const date = '2026-11-19'
const lessons = validateContent().lessons
const lesson = lessons.find(item => item.date === date)!
const historicalPracticeLessons = ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'].map(date => lessons.find(item => item.date === date)!)
const references = getPracticeQuestions(lesson)
const categories: PracticeCategory[] = ['vocabulary', 'grammar', 'reading']
const counts: Record<PracticeCategory, number> = { vocabulary: 5, grammar: 5, reading: 8 }
const navLabels: Record<PracticeCategory, string> = { vocabulary: 'N1 語彙', grammar: 'N1 文法', reading: '読解練習' }
const firstQuestion = (category: PracticeCategory) => references.find(item => item.category === category)!.question
const exercise = (page: Page, question: ReadingQuestion) => page.locator(`[id="${questionElementId(question.id)}"]`)
const reviewRow = (page: Page, question: ReadingQuestion) => page.locator(`.review-row[data-review-question="${question.id}"]`)
const records = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('n1-progress') ?? '{}') as StoredProgress)

async function openDay82(page: Page, category: PracticeCategory = 'vocabulary', question = firstQuestion(category)) {
  await page.goto(`/${practiceHref(date, category, question.id)}`)
  await expect(page.locator('.date-dropdown-trigger')).toContainText('Day 82')
  await expect(exercise(page, question)).toBeVisible()
}

async function openCategory(page: Page, category: PracticeCategory) {
  await page.getByRole('button', { name: navLabels[category], exact: true }).click()
  await expect(page.locator(`[data-practice-category="${category}"]`)).toBeVisible()
}

async function openReview(page: Page, targetLesson = lesson) {
  const datePicker = page.locator('.date-dropdown-trigger')
  if (!(await datePicker.innerText()).includes(`Day ${targetLesson.day}`)) {
    await datePicker.click()
    await page.getByRole('option', { name: new RegExp(`^Day ${targetLesson.day}\\b`) }).click()
    await expect(datePicker).toContainText(`Day ${targetLesson.day}`)
  }
  await page.getByRole('button', { name: '誤答復習', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'この日の実際の誤答', exact: true })).toBeVisible()
}

async function submit(page: Page, question: ReadingQuestion, answer: number) {
  const target = exercise(page, question)
  await target.locator('.answer-option').nth(answer).click()
  await target.getByRole('button', { name: '回答する', exact: true }).click()
  await expect(target.locator('.result-panel')).toBeVisible()
}

test('Day82 has 18 categorized questions, intact passages, and no presumed mistakes', async ({ page }) => {
  expect(lesson.day).toBe(82)
  expect(lesson.practice).toBeDefined()
  expect(references).toHaveLength(18)
  await openDay82(page)
  for (const category of categories) {
    await openCategory(page, category)
    const section = page.locator(`[data-practice-category="${category}"]`)
    await expect(section.locator('.question-block')).toHaveCount(counts[category])
    await expect(section.locator('.practice-completion')).toHaveText(`回答済み 0 / ${counts[category]}`)
    await expect(section.locator('.result-panel')).toHaveCount(0)
    await expect(section.locator('.answer-choice-audio')).toHaveCount(0)
    for (const { question } of references.filter(item => item.category === category)) {
      await expect(exercise(page, question).locator('.answer-option')).toHaveCount(4)
      await expect(exercise(page, question).getByRole('button', { name: '回答する', exact: true })).toBeDisabled()
    }
  }
  await expect(page.locator('[data-practice-kind="short"] .question-block')).toHaveCount(2)
  await expect(page.locator('[data-practice-kind="medium"] .question-block')).toHaveCount(2)
  await expect(page.locator('[data-practice-kind="long"] .question-block')).toHaveCount(2)
  await expect(page.locator('[data-practice-kind="comparison"] .question-block')).toHaveCount(1)
  await expect(page.locator('[data-practice-kind="information"] .question-block')).toHaveCount(1)
  await expect(page.locator('details.legacy-reading')).not.toHaveAttribute('open')
  await openReview(page)
  await expect(page.locator('.review-row')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'この日の誤答記録はありません' })).toBeVisible()
})

test('selecting an option alone neither saves an answer nor creates a mistake', async ({ page }) => {
  const question = firstQuestion('vocabulary')
  await openDay82(page)
  await exercise(page, question).locator('.answer-option').nth((question.answer + 1) % 4).click()
  await expect(exercise(page, question).locator('.answer-option.selected')).toHaveCount(1)
  await expect(exercise(page, question).locator('.result-panel')).toHaveCount(0)
  expect((await records(page)).readingAnswers[question.id]).toBeUndefined()
  expect((await records(page)).readingAttempts[question.id]).toBeUndefined()
  await openReview(page)
  await expect(page.locator('.review-row')).toHaveCount(0)
  await page.reload()
  expect((await records(page)).readingAnswers[question.id]).toBeUndefined()
})

test('a correct first submission stays out of the wrong-answer queue', async ({ page }) => {
  const question = firstQuestion('grammar')
  await openDay82(page, 'grammar')
  await submit(page, question, question.answer)
  await expect(exercise(page, question).locator('.result-title')).toHaveText('正解です')
  const saved = await records(page)
  expect(saved.readingAnswers[question.id]).toBe(question.answer)
  expect(saved.readingAttempts[question.id]).toHaveLength(1)
  expect(saved.readingAttempts[question.id][0].at).not.toBeNull()
  await openReview(page)
  await expect(page.locator('.review-row')).toHaveCount(0)
})

test('actual wrong submissions from all three categories enter the matching queue', async ({ page }) => {
  await openDay82(page)
  for (const [index, category] of categories.entries()) {
    const question = firstQuestion(category)
    await openCategory(page, category)
    await submit(page, question, (question.answer + 1) % 4)
    await openReview(page)
    await expect(page.locator('.review-row')).toHaveCount(index + 1)
    const row = reviewRow(page, question)
    await expect(row).toBeVisible()
    await expect(row).toContainText('連続正解 0/2')
    await expect(row.getByRole('link')).toHaveAttribute('href', practiceHref(date, category, question.id))
    expect((await records(page)).readingAttempts[question.id]).toHaveLength(1)
  }
  await page.reload()
  await openReview(page)
  await expect(page.locator('.review-row')).toHaveCount(3)
})

test('a review link opens exactly that question for a fresh retry, and its URL survives refresh', async ({ page }) => {
  const question = references.filter(item => item.category === 'grammar')[3].question
  await openDay82(page, 'grammar', question)
  await submit(page, question, (question.answer + 1) % 4)
  await openReview(page)
  await reviewRow(page, question).getByRole('link').click()
  const target = exercise(page, question)
  await expect(page).toHaveURL(new RegExp(`${practiceHref(date, 'grammar', question.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expect(target).toBeFocused()
  await expect(target.locator('.result-panel')).toHaveCount(0)
  await expect(target.locator('.answer-option:disabled')).toHaveCount(0)
  await expect(target.getByRole('button', { name: '回答する', exact: true })).toBeDisabled()
  expect((await records(page)).readingAttempts[question.id]).toHaveLength(1)
  await page.reload()
  await expect(target).toBeFocused()
  await expect(target.locator('.result-panel')).toBeVisible()
  await expect(page.locator('[data-practice-category="grammar"]')).toBeVisible()
  expect((await records(page)).readingAttempts[question.id]).toHaveLength(1)
})

test('one real correct retry remains daily; two correct retries extend to three days without erasing history', async ({ page }) => {
  const question = firstQuestion('reading')
  await page.clock.setFixedTime(new Date('2026-11-19T01:00:00Z'))
  await openDay82(page, 'reading')
  await submit(page, question, (question.answer + 1) % 4)
  await openReview(page)
  await expect(reviewRow(page, question)).toContainText('2026-11-20')

  await page.clock.setFixedTime(new Date('2026-11-20T01:00:00Z'))
  await reviewRow(page, question).getByRole('link').click()
  await submit(page, question, question.answer)
  await openReview(page)
  await expect(reviewRow(page, question)).toContainText('連続正解 1/2')
  await expect(reviewRow(page, question)).toContainText('2026-11-21')
  await expect(reviewRow(page, question)).toContainText('1日間隔')

  await page.clock.setFixedTime(new Date('2026-11-21T01:00:00Z'))
  await reviewRow(page, question).getByRole('link').click()
  await submit(page, question, question.answer)
  await openReview(page)
  await expect(reviewRow(page, question)).toContainText('連続正解 2回')
  await expect(reviewRow(page, question)).toContainText('2026-11-24')
  await expect(reviewRow(page, question)).toContainText('3日間隔')
  await expect(reviewRow(page, question)).toHaveAttribute('data-due', 'false')
  const history = (await records(page)).readingAttempts[question.id]
  expect(history).toHaveLength(3)
  expect(history.map(attempt => attempt.answer)).toEqual([(question.answer + 1) % 4, question.answer, question.answer])
  expect(history.map(attempt => attempt.at)).toEqual(['2026-11-19T01:00:00.000Z', '2026-11-20T01:00:00.000Z', '2026-11-21T01:00:00.000Z'])
  await page.reload()
  await openReview(page)
  await expect(reviewRow(page, question)).toContainText('連続正解 2回')
  expect((await records(page)).readingAttempts[question.id]).toHaveLength(3)
})

for (const archivedLesson of [...historicalPracticeLessons, lesson]) test(`the archived Day${archivedLesson.day} question keeps its original ID, option indexes, and undated legacy history`, async ({ page }) => {
  const original = archivedLesson.reading.question
  await page.addInitScript(({ id, answer }) => localStorage.setItem('n1-progress', JSON.stringify({
    vocab: { 'old-absent-vocab': 'mastered' }, grammar: {}, readingAnswers: { [id]: answer },
  })), { id: original.id, answer: original.answer })
  await page.goto(`/${practiceHref(archivedLesson.date, 'reading', original.id)}`)
  const target = page.locator('#reading-question')
  await expect(page.locator('.date-dropdown-trigger')).toContainText(`Day ${archivedLesson.day}`)
  await expect(page.locator('details.legacy-reading')).toHaveAttribute('open', '')
  await expect(target).toBeFocused()
  await expect(target.locator('.result-title')).toHaveText('正解です')
  const selected = target.locator('.answer-option.selected')
  await expect(selected).toContainText(original.options[original.answer])
  await expect(selected.locator('.answer-letter')).toHaveText(String.fromCharCode(65 + (archivedLesson.day - 1) % 4))
  await target.locator('.attempt-history summary').click()
  await expect(target.locator('.attempt-history li')).toHaveText(/以前の記録（日付不明）/)
  const saved = await records(page)
  expect(saved.readingAnswers[original.id]).toBe(original.answer)
  expect(saved.readingAttempts[original.id]).toEqual([{ answer: original.answer, at: null }])
  expect(saved.vocab['old-absent-vocab']).toBe('mastered')
  expect(getPracticeQuestions(archivedLesson).every(({ question }) => saved.readingAnswers[question.id] === undefined)).toBe(true)
  await openReview(page, archivedLesson)
  await expect(page.locator('.review-row')).toHaveCount(0)
})

for (const historicalLesson of historicalPracticeLessons) test(`Day${historicalLesson.day} category links load the archived lesson and keep its mistakes separate from other dates`, async ({ page }) => {
  expect(historicalLesson.practice).toBeDefined()
  const questions = getPracticeQuestions(historicalLesson)
  const otherLessons = [...historicalPracticeLessons, lesson].filter(item => item.date !== historicalLesson.date)
  expect(questions).toHaveLength(18)
  for (const category of categories) {
    const categoryQuestions = questions.filter(item => item.category === category)
    const { question } = categoryQuestions.at(-1)!
    await page.goto(`/${practiceHref(historicalLesson.date, category, question.id)}`)
    await expect(page.locator('.date-dropdown-trigger')).toContainText(`Day ${historicalLesson.day}`)
    await expect(page.locator(`[data-practice-category="${category}"] .question-block`)).toHaveCount(counts[category])
    await expect(exercise(page, question)).toBeFocused()
    await expect(exercise(page, question).locator('.result-panel')).toHaveCount(0)
    await expect(exercise(page, question).getByRole('button', { name: '回答する', exact: true })).toBeDisabled()
  }
  expect(Object.keys((await records(page)).readingAnswers)).toHaveLength(0)

  const readingQuestion = questions.filter(item => item.category === 'reading').at(-1)!.question
  await submit(page, readingQuestion, (readingQuestion.answer + 1) % 4)
  await openReview(page, historicalLesson)
  await expect(page.locator('.review-row')).toHaveCount(1)
  await expect(reviewRow(page, readingQuestion).getByRole('link')).toHaveAttribute('href', practiceHref(historicalLesson.date, 'reading', readingQuestion.id))
  for (const otherLesson of otherLessons) {
    await openReview(page, otherLesson)
    await expect(page.locator('.review-row')).toHaveCount(0)
  }
  await openReview(page, historicalLesson)
  await reviewRow(page, readingQuestion).getByRole('link').click()
  await expect(exercise(page, readingQuestion)).toBeFocused()
  await expect(exercise(page, readingQuestion).locator('.result-panel')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.date-dropdown-trigger')).toContainText(`Day ${historicalLesson.day}`)
  await expect(exercise(page, readingQuestion)).toBeFocused()
  await expect(exercise(page, readingQuestion).locator('.result-panel')).toBeVisible()
  const saved = await records(page)
  expect(saved.readingAttempts[readingQuestion.id]).toHaveLength(1)
  expect(saved.readingAnswers[historicalLesson.reading.question.id]).toBeUndefined()
  expect(Object.keys(saved.readingAnswers)).toEqual([readingQuestion.id])
})

test('a nonexistent question link cannot point at another exercise or create an answer', async ({ page }) => {
  await page.goto(`/${practiceHref(date, 'grammar', `${date}-question-does-not-exist`)}`)
  await expect(page.getByRole('alert')).toContainText('指定された問題はこの教材に見つかりませんでした')
  expect(Object.keys((await records(page)).readingAnswers)).toHaveLength(0)
  await openReview(page)
  await expect(page.locator('.review-row')).toHaveCount(0)
})

test('mobile question pages stay within the viewport and the information table scrolls inside its region', async ({ page }, testInfo) => {
  const information = lesson.practice!.groups.find(group => group.kind === 'information')!
  await page.setViewportSize({ width: 390, height: 844 })
  await openDay82(page, 'reading', information.questions[0])
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const tableRegion = page.getByRole('region', { name: information.table!.caption, exact: true })
  await tableRegion.scrollIntoViewIfNeeded()
  await expect(tableRegion.getByRole('table')).toBeVisible()
  await expect(tableRegion.getByRole('columnheader')).toHaveCount(information.table!.headers.length)
  expect(await tableRegion.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
  await tableRegion.focus()
  await tableRegion.press('ArrowRight')
  await expect.poll(() => tableRegion.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('day82-information-mobile.png') })
  await exercise(page, information.questions[0]).scrollIntoViewIfNeeded()
  await expect(exercise(page, information.questions[0]).locator('.answer-option')).toHaveCount(4)
  await page.screenshot({ path: testInfo.outputPath('day82-question-mobile.png') })
})
