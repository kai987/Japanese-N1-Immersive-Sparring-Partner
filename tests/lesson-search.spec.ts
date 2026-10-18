import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { validateContent } from '../scripts/validate-content.ts'
import { withItStudy, validateStudySnapshot, type StudySnapshot } from '../src/lib/itStudy.ts'
import { reviewFocusByDate as legacyReview } from '../src/data/history-legacy.ts'

// Browser plugin not available; use the project's configured Playwright browser.
// Flow: global result -> exact dated card/paragraph -> highlighted text in view.
const catalog = validateContent()
const snapshot = validateStudySnapshot(JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json', import.meta.url), 'utf8')) as StudySnapshot)
const lessons = catalog.lessons.map(item => withItStudy(item, snapshot))
const wordLesson = lessons.find(item => item.vocabulary.some(word => word.word === '間に合う'))!
const word = wordLesson.vocabulary.find(item => item.word === '間に合う')!
const historical = lessons[1]
const grammar = historical.grammar.at(-1)!
const paragraphIndex = historical.immersion.paragraphs.length - 1
const reviews = { ...legacyReview, ...Object.fromEntries(catalog.generated.map(entry => [entry.lesson.date, entry.reviewFocus ?? []])) }
const input = (page: Page) => page.getByRole('textbox', { name: '全站搜索', exact: true })
const current = (page: Page) => page.locator('.content-shell mark.lesson-search-hit.is-current[aria-current="true"]')

function watchErrors(page: Page) {
  const messages: string[] = []
  page.on('pageerror', error => messages.push(error.message))
  page.on('console', message => { if (message.type() === 'error') messages.push(message.text()) })
  return messages
}
async function openResult(page: Page, query: string, date: string, anchor: string) {
  const inputQuery = query.replace(/[\r\n]/gu, ' ')
  await input(page).fill(inputQuery)
  // The anchor is carried on the result itself rather than inferred from its label.
  const target = page.locator(`.daily-search-result[data-search-kind="lesson"][data-search-target="${date}"][data-search-anchor="${anchor}"]`)
  await expect(target).toBeVisible()
  await target.click()
  await expect(page.getByRole('region', { name: '教材の検索結果', exact: true })).toHaveCount(0)
  await expect(input(page)).toHaveValue(inputQuery)
  await expectVisibleMatch(page)
}
async function expectVisibleMatch(page: Page) {
  await expect(current(page)).toHaveCount(1)
  await expect(current(page)).toBeInViewport()
  await expect.poll(async () => {
    const [hit, topbar] = await Promise.all([current(page).boundingBox(), page.locator('.topbar').boundingBox()])
    return !!hit && !!topbar && hit.y >= topbar.y + topbar.height && hit.y + hit.height <= await page.evaluate(() => innerHeight)
  }).toBe(true)
}

test('clicking the daily 合う result scrolls to 間に合う even when the vocabulary section is already open', async ({ page }, testInfo) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: 'N1 語彙', exact: true }).click()
  const before = await page.evaluate(() => localStorage.getItem('n1-progress'))
  const anchor = `vocabulary-${word.id}`
  await openResult(page, '合う', wordLesson.date, anchor)
  const card = page.locator(`[data-vocabulary-id="${word.id}"]`)
  await expect(card).toBeFocused()
  await expect(card.locator('h3 mark.is-current')).toHaveText('合う')
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200)
  await page.screenshot({ path: testInfo.outputPath('daily-search-word-position.png') })
  // Selecting the same result a second time must locate again, even without a
  // date/section change, and reading/clicking results must not mark study progress.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await openResult(page, '合う', wordLesson.date, anchor)
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200)
  expect(await page.evaluate(() => localStorage.getItem('n1-progress'))).toBe(before)
  await page.getByRole('button', { name: '検索をクリア', exact: true }).click()
  await expect(page.locator('.content-shell mark.lesson-search-hit')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('a historical grammar result opens its exact card and highlights the matched example', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  const anchor = `grammar-${grammar.id}`
  await openResult(page, grammar.example, historical.date, anchor)
  await expect(page.locator(`[data-grammar-id="${grammar.id}"]`)).toBeFocused()
  await expect(current(page)).toHaveText(grammar.example)
  await expect(page.locator('.date-dropdown-trigger strong')).toContainText(historical.date.slice(0, 4))
  expect(errors).toEqual([])
})

test('translation and analysis results reveal the right reading mode and exact paragraph', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  const anchor = `immersion-paragraph-${paragraphIndex}`
  for (const [query, mode, selector] of [
    [historical.immersion.translations[paragraphIndex], '日中対訳', '.zh-translation'],
    [historical.immersion.analysis[paragraphIndex], '解説', '.analysis-note'],
  ]) {
    await openResult(page, query, historical.date, anchor)
    await expect(page.getByRole('group', { name: '読解の表示モード', exact: true }).getByRole('button', { name: mode, exact: true })).toHaveClass(/active/)
    await expect(page.locator(`#${anchor} ${selector} mark.is-current`)).toHaveText(query)
  }
  expect(errors).toEqual([])
})

test('review and reading question results locate their rows without recording an answer', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await openResult(page, reviews[historical.date][0].detail, historical.date, 'review-0')
  await expect(page.locator('#review-0')).toBeFocused()
  await openResult(page, historical.reading.question.prompt, historical.date, 'reading-question')
  await expect(page.locator('#reading-question')).toBeFocused()
  await expect(page.locator('.result-panel')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '回答する', exact: true })).toBeDisabled()
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem('n1-progress')!).readingAnswers[id], historical.reading.question.id)).toBeUndefined()
  expect(errors).toEqual([])
})

test('daily result highlights remain below the fixed header on 390px dark screens', async ({ page }, testInfo) => {
  const errors = watchErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('n1-theme', JSON.stringify('dark')))
  await page.goto('/')
  await openResult(page, '合う', wordLesson.date, `vocabulary-${word.id}`)
  await expect(input(page)).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('daily-search-mobile-dark-position.png') })
  expect(errors).toEqual([])
})
