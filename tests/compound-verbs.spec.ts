import { test, expect, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { validateContent } from '../scripts/validate-content.ts'
import { compoundVerbSeries } from '../src/data/compound-verbs.ts'
import { withItStudy, type StudySnapshot } from '../src/lib/itStudy.ts'

// Browser plugin not available; use this repository's configured Playwright workflow.
// Flow: vocabulary card -> related compound series -> another series -> original dated card.
const catalog = validateContent()
const snapshot = JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json', import.meta.url), 'utf8')) as StudySnapshot
const lessons = catalog.lessons.map(lesson => withItStudy(lesson, snapshot))
const sourceLesson = lessons.find(lesson => lesson.vocabulary.some(word => word.word === '間に合う'))!
if (!sourceLesson) throw new Error('The displayed 間に合う vocabulary fixture is missing')
const sourceWord = sourceLesson.vocabulary.find(word => word.word === '間に合う')!
const nonCompoundLesson = lessons.find(lesson => lesson.vocabulary.some(word => word.word === '相殺する'))!
if (!nonCompoundLesson) throw new Error('The displayed 相殺する vocabulary fixture is missing')
const nonCompoundWord = nonCompoundLesson.vocabulary.find(word => word.word === '相殺する')!

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
  return errors
}

async function navigate(page: Page, label: string) {
  const menu = page.getByRole('button', { name: 'ナビゲーションを開く', exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
    .getByRole('button', { name: label, exact: true }).click()
}

async function openVocabulary(page: Page, date = sourceLesson.date) {
  const index = lessons.findIndex(lesson => lesson.date === date)
  await page.locator('.date-dropdown-trigger').click()
  await page.locator('.date-dropdown-option').nth(index).click()
  await navigate(page, 'N1 語彙')
  await expect(page.getByRole('heading', { name: 'N1 語彙', exact: true })).toBeVisible()
}

const vocabularyCard = (page: Page, id: string) => page.locator(`article.learning-card[data-vocabulary-id="${id}"]`)
const seriesButton = (page: Page, id: string) => page.locator(`.compound-series-button[data-series-id="${id}"]`)
const detail = (page: Page, id: string) => page.locator(`article.compound-detail[data-series-id="${id}"]`)

async function expectRightAlignedMetadata(card: Locator) {
  const header = card.locator('.word-line')
  const metadata = card.locator('.vocabulary-meta')
  const reference = metadata.locator('.study-reference')
  await expect(metadata).toBeVisible()
  const bounds = await Promise.all([header.boundingBox(), metadata.boundingBox(), reference.boundingBox()])
  if (bounds.some(value => !value)) throw new Error('Vocabulary metadata has no rendered bounds')
  const [head, meta, ref] = bounds.map(value => value!)
  expect(Math.abs(head.x + head.width - meta.x - meta.width)).toBeLessThanOrEqual(2)
  expect(Math.abs(meta.x + meta.width - ref.x - ref.width)).toBeLessThanOrEqual(2)
  const aligned = await reference.evaluate(element => getComputedStyle(element).alignItems)
  expect(aligned).toBe('flex-end')
  const badges = await reference.locator('.study-reference-badges').boundingBox()
  if (!badges) throw new Error('The right-aligned badge group is missing')
  expect(Math.abs(ref.x + ref.width - badges.x - badges.width)).toBeLessThanOrEqual(2)
}

test('sidebar opens compound series and Japanese/reading search and series selection work', async ({ page }, testInfo) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await expect(page).toHaveTitle('N1 Immersive Sparring Partner')
  await expect(page.locator('.hero h1')).toBeVisible()
  await navigate(page, '複合動詞')
  await expect(page.getByRole('heading', { name: '複合動詞', exact: true })).toBeVisible()
  await expect(page.locator('.compound-series-button')).toHaveCount(compoundVerbSeries.length)
  await expect(page).toHaveURL(/#compound-verbs(?:\/[a-z-]+)?$/)
  const search = page.getByRole('textbox', { name: '全站搜索', exact: true })
  await search.fill('まにあう')
  await expect(seriesButton(page, 'au')).toBeVisible()
  await expect(seriesButton(page, 'time-quantity')).toBeVisible()
  await seriesButton(page, 'time-quantity').click()
  await expect(detail(page, 'time-quantity')).toBeVisible()
  await expect(detail(page, 'time-quantity').locator('.compound-word-card h3').filter({ hasText: /^間に合う$/ })).toBeVisible()
  await search.fill('存在しない複合動詞 zzz-no-match')
  await expect(page.locator('.compound-series-button')).toHaveCount(0)
  await search.fill('')
  await expect(page.locator('.compound-series-button')).toHaveCount(compoundVerbSeries.length)
  await seriesButton(page, 'komu').click()
  await expect(detail(page, 'komu')).toBeVisible()
  await expect(page).toHaveURL(/#compound-verbs\/komu$/)
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('compound-series-desktop.png') })
  expect(errors).toEqual([])
})

test('vocabulary tags jump to related series and return to the original dated vocabulary card', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await openVocabulary(page, nonCompoundLesson.date)
  await expect(vocabularyCard(page, nonCompoundWord.id).locator('.compound-verb-tag')).toHaveCount(0)
  await openVocabulary(page)
  const card = vocabularyCard(page, sourceWord.id)
  const sourceDate = await page.locator('.date-dropdown-trigger strong').innerText()
  await card.getByRole('button', { name: '習得済み', exact: true }).click()
  const before = await page.evaluate(() => localStorage.getItem('n1-progress'))
  await card.getByRole('button', { name: '間に合うの複合動詞シリーズを開く', exact: true }).click()
  await expect(detail(page, 'au')).toBeVisible()
  await expect(detail(page, 'au').locator('.compound-word-card h3').filter({ hasText: /^間に合う$/ })).toBeVisible()
  await seriesButton(page, 'time-quantity').click()
  await expect(detail(page, 'time-quantity')).toBeVisible()
  await page.getByRole('button', { name: '元の語彙カードに戻る', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'N1 語彙', exact: true })).toBeVisible()
  await expect(page.locator('.date-dropdown-trigger strong')).toHaveText(sourceDate)
  await expect(card.locator('h3')).toBeInViewport()
  await expect(card.getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
  expect(await page.evaluate(() => localStorage.getItem('n1-progress'))).toEqual(before)
  await expect(page).not.toHaveURL(/#compound-verbs/)
  expect(errors).toEqual([])
})

test('compound deep links survive reload and stay usable at 390px without horizontal overflow', async ({ page }, testInfo) => {
  const errors = watchErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#compound-verbs/time-quantity')
  await expect(page.getByRole('heading', { name: '複合動詞', exact: true })).toBeVisible()
  await expect(detail(page, 'time-quantity')).toBeVisible()
  await page.reload()
  await expect(detail(page, 'time-quantity')).toBeVisible()
  await expect(page).toHaveURL(/#compound-verbs\/time-quantity$/)
  await expect(page.getByRole('textbox', { name: '全站搜索', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await navigate(page, 'N1 語彙')
  await navigate(page, '複合動詞')
  await expect(page.getByRole('heading', { name: '複合動詞', exact: true })).toBeVisible()
  await expect(page.locator('.mobile-overlay')).toHaveCount(0)
  await navigate(page, '直播条反')
  await expect(page.getByRole('heading', { name: '直播条反', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#live-reactions$/)
  await navigate(page, '複合動詞')
  await expect(page.getByRole('heading', { name: '複合動詞', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#compound-verbs(?:\/[a-z-]+)?$/)
  await navigate(page, '直播条反')
  await expect(page.getByRole('heading', { name: '直播条反', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#live-reactions$/)
  await navigate(page, '複合動詞')
  await page.screenshot({ path: testInfo.outputPath('compound-series-mobile.png') })
  await page.getByRole('button', { name: 'ナビゲーションを開く', exact: true }).click()
  await page.getByRole('button', { name: '表示テーマを切り替える', exact: true }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark')
  const backdrop = page.getByRole('button', { name: 'ナビゲーションを閉じる', exact: true })
  const backdropBounds = await backdrop.boundingBox()
  if (!backdropBounds) throw new Error('The mobile navigation backdrop is missing')
  await backdrop.click({ position: { x: backdropBounds.width - 12, y: 12 } })
  await expect(page.locator('.mobile-overlay')).toHaveCount(0)
  await expect(page.locator('.sidebar')).not.toBeInViewport()
  await page.screenshot({ path: testInfo.outputPath('compound-series-mobile-dark.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.setViewportSize({ width: 320, height: 844 })
  await expect(page.locator('.compound-detail')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('compound-series-mobile-320.png') })
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('vocabulary metadata aligns right on desktop and mobile and frequency details remain interactive', async ({ page }, testInfo) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await openVocabulary(page, nonCompoundLesson.date)
  const card = vocabularyCard(page, nonCompoundWord.id)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await card.scrollIntoViewIfNeeded()
    await expectRightAlignedMetadata(card)
    const frequency = card.locator('.study-frequency')
    await frequency.locator('summary').click()
    await expect(frequency).toHaveAttribute('open', '')
    await expect(frequency.locator('p').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`vocabulary-metadata-${width}.png`) })
    await frequency.locator('summary').click()
    await expect(frequency).not.toHaveAttribute('open', '')
  }
  expect(errors).toEqual([])
})
