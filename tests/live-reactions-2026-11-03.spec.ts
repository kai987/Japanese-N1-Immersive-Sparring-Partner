import { test, expect, type Page } from '@playwright/test'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'

// Browser plugin not available; use the project's isolated Playwright contexts.
const unitId = '2026-11-03'
const unit = liveUnits.find(unit => unit.id === unitId)!
const storageKey = 'n1-live-reactions-progress-v1'
const search = (page: Page) => page.getByRole('textbox', { name: '全站搜索', exact: true })
const results = (page: Page) => page.getByRole('region', { name: '教材の検索結果', exact: true })
const navigation = (page: Page) => page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })

test('November 3 unit is available from the sidebar with source-labelled cards and audio controls', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle('N1 Immersive Sparring Partner')
  await navigation(page).getByRole('button', { name: '直播条反', exact: true }).click()
  await expect(page.getByLabel('选择学习单元', { exact: true })).toHaveValue(liveUnits[0].id)
  if (liveUnits[0].id !== unitId) await page.getByLabel('选择学习单元', { exact: true }).selectOption(unitId)
  await expect(page.locator('#live-unit-title')).toHaveText(unit.title)
  await expect(page.locator('[data-live-group]')).toHaveCount(unit.groups.length)
  await expect(page.locator('.live-entry')).toHaveCount(unit.groups.reduce((sum, group) => sum + group.entries.length, 0))
  await expect(page.locator('.live-source-quote')).toHaveCount(unit.groups.length)
  const annotatedGroup = unit.groups.find(group => group.source!.quote.includes('いつの間に＝いつ'))!
  const annotated = page.locator(`[data-live-group="${annotatedGroup.id}"]`)
  await expect(annotated.locator('.live-source-quote')).toContainText('いつの間に＝いつ')
  await expect(annotated.locator('.live-source-quote .audio-play-button')).toHaveCount(0)
  await expect(annotated.locator('.live-entry .audio-play-button')).toHaveCount(annotatedGroup.entries.length)
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('live-november3-desktop.png') })
  expect(errors).toEqual([])
})

const boomerangMeaning = () => unit.groups.flatMap(group => group.entries).find(entry => entry.expression === 'ブーメラン')!.meaning
for (const query of ['タイミングを見計らう', 'みはからう', boomerangMeaning]) {
  test(`November 3 global search opens, highlights and scrolls to its exact match: ${typeof query === 'string' ? query : 'Chinese meaning'}`, async ({ page }) => {
    const value = typeof query === 'function' ? query() : query
    await page.goto('/?live-unit=2026-09-30-okashi-bokuso#live-reactions')
    await page.getByRole('group', { name: '内容分类', exact: true }).getByRole('button', { name: /漫画双关/ }).click()
    await page.getByRole('group', { name: '筛选学习状态', exact: true }).getByRole('button', { name: '習得済み', exact: true }).click()
    await search(page).fill(value)
    const target = unit.groups.find(group => matchesLiveGroup(group, value))!
    await results(page).locator(`[data-search-kind="live"][data-search-target="${target.id}"]`).click()
    await expect(page.locator('.live-page')).toHaveAttribute('data-live-unit', unitId)
    await expect(page.getByLabel('选择知识组', { exact: true })).toHaveValue('all')
    await expect(search(page)).toHaveValue(value)
    const mark = page.locator(`[data-live-group="${target.id}"] mark.search-hit`).first()
    await expect(mark).toBeInViewport()
    const [match, header] = await Promise.all([mark.boundingBox(), page.locator('.topbar').boundingBox()])
    expect(match!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
    await expect(results(page)).toHaveCount(0)
  })
}

test('November 3 learning marks coexist with earlier live marks and survive unit switches', async ({ page }) => {
  await page.addInitScript(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, groups: {
      'live-2026-09-28-endurance': 'mastered', 'live-2026-10-29-dore-dakke': 'review',
    } }))
  }, storageKey)
  await page.goto(`/?live-unit=${unitId}#live-reactions`)
  const first = page.locator(`[data-live-group="${unit.groups[0].id}"]`)
  await first.getByRole('button', { name: '習得済み', exact: true }).click()
  await page.getByLabel('选择学习单元', { exact: true }).selectOption('2026-10-29')
  await expect(page.locator('[data-live-group="live-2026-10-29-dore-dakke"]').getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('选择学习单元', { exact: true }).selectOption(unitId)
  await expect(first.getByRole('button', { name: '習得済み', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)
  expect(saved.groups).toMatchObject({ 'live-2026-09-28-endurance': 'mastered', 'live-2026-10-29-dore-dakke': 'review', [unit.groups[0].id]: 'mastered' })
  await page.reload()
  await expect(page.getByLabel('选择学习单元', { exact: true })).toHaveValue(unitId)
  await expect(first.getByRole('button', { name: '習得済み', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('November 3 long notes fit 390px and 320px dark screens', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('n1-theme', JSON.stringify('dark')))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/?live-unit=${unitId}#live-reactions`)
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark')
  const longGroup = unit.groups.find(group => group.entries.some(entry => entry.expression.includes('電気をつけたまま')))!
  await page.getByLabel('选择知识组', { exact: true }).selectOption(longGroup.id)
  await expect(page.locator('[data-live-group]')).toHaveCount(1)
  await page.locator('[data-live-group]').scrollIntoViewIfNeeded()
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await expect(page.locator('.live-entry').filter({ hasText: '電気をつけたまま' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`live-november3-dark-${width}.png`) })
  }
})
