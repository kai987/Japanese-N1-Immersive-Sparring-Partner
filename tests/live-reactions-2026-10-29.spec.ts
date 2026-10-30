import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { liveUnits, liveCategories } from '../src/data/live-reaction-units.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'

// Browser plugin not available; use the project's Playwright interaction tests.

const unitId = '2026-10-29'
const unit = liveUnits.find(unit => unit.id === unitId)!
const storageKey = 'n1-live-reactions-progress-v1'
const evidence = '/tmp/n1-improvements-playwright/live-2026-10-29'
const search = (page: Page) => page.getByRole('textbox', { name: '全站搜索', exact: true })
const results = (page: Page) => page.getByRole('region', { name: '教材の検索結果', exact: true })

test('sidebar opens the latest screenshot unit with complete source-labelled cards', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle('N1 Immersive Sparring Partner')
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: '直播条反', exact: true }).click()
  await expect(page.getByLabel('选择学习单元', { exact: true })).toHaveValue(unitId)
  await expect(page.locator('#live-unit-title')).toHaveText(unit.title)
  await expect(page.locator('[data-live-group]')).toHaveCount(unit.groups.length)
  await expect(page.locator('.live-entry')).toHaveCount(unit.groups.reduce((sum, group) => sum + group.entries.length, 0))
  await expect(page.locator('.live-source-quote')).toHaveCount(unit.groups.length)
  const annotated = page.locator('[data-live-group="live-2026-10-29-prohibition"]')
  await expect(annotated.locator('.live-source-quote')).toContainText('不允许')
  await expect(annotated.locator('.live-source-quote .audio-play-button')).toHaveCount(0)
  await expect(annotated.locator('.live-entry .audio-play-button')).toHaveCount(3)
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  await mkdir(evidence, { recursive: true })
  await page.screenshot({ path: `${evidence}/desktop.png` })
  const category = liveCategories.find(category => unit.groups.some(group => group.category === category.id))!
  await page.getByRole('group', { name: '内容分类', exact: true }).getByRole('button', { name: new RegExp(category.label) }).click()
  await expect(page.locator('[data-live-group]')).toHaveCount(unit.groups.filter(group => group.category === category.id).length)
  expect(errors).toEqual([])
})

const expectation = unit.groups.flatMap(group => group.entries).find(entry => entry.expression.includes('期待外れ'))!
for (const query of ['山に見える', 'はぐくむ', expectation.meaning]) {
  test(`global search clears restricted older-unit filters and scrolls below the header: ${query}`, async ({ page }) => {
    await page.goto('/?live-unit=2026-09-30-okashi-bokuso#live-reactions')
    await page.getByRole('group', { name: '内容分类', exact: true }).getByRole('button', { name: /漫画双关/ }).click()
    await page.getByRole('group', { name: '筛选学习状态', exact: true }).getByRole('button', { name: '習得済み', exact: true }).click()
    await search(page).fill(query)
    const target = unit.groups.find(group => matchesLiveGroup(group, query))!
    await results(page).locator(`[data-search-kind="live"][data-search-target="${target.id}"]`).click()
    await expect(page.locator('.live-page')).toHaveAttribute('data-live-unit', unitId)
    await expect(page.getByLabel('选择知识组', { exact: true })).toHaveValue('all')
    await expect(search(page)).toHaveValue(query)
    const mark = page.locator(`[data-live-group="${target.id}"] mark.search-hit`).first()
    await expect(mark).toBeInViewport()
    const [match, header] = await Promise.all([mark.boundingBox(), page.locator('.topbar').boundingBox()])
    expect(match!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
    await expect(results(page)).toHaveCount(0)
  })
}

test('October notes retain independent review marks across unit switches and reload without altering daily records', async ({ page }) => {
  await page.addInitScript(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, groups: { 'live-2026-09-28-endurance': 'mastered' } }))
  }, storageKey)
  await page.goto('/')
  const navigation = page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
  await navigation.getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true }).click()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('n1-progress'))).toContain('mastered')
  const daily = await page.evaluate(() => [localStorage.getItem('n1-progress'), localStorage.getItem('n1-completed-lessons')])
  await navigation.getByRole('button', { name: '直播条反', exact: true }).click()
  const first = page.locator(`[data-live-group="${unit.groups[0].id}"]`)
  await first.getByRole('button', { name: '要復習', exact: true }).click()
  await page.getByLabel('选择学习单元', { exact: true }).selectOption('2026-09-28')
  await expect(page.locator('[data-live-group]').first().getByRole('button', { name: '習得済み', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('选择学习单元', { exact: true }).selectOption(unitId)
  await expect(first.getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByLabel('选择学习单元', { exact: true })).toHaveValue(unitId)
  await expect(first.getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => [localStorage.getItem('n1-progress'), localStorage.getItem('n1-completed-lessons')])).toEqual(daily)
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).groups, storageKey)).toMatchObject({
    'live-2026-09-28-endurance': 'mastered', [unit.groups[0].id]: 'review',
  })
})

test('new note cards and category controls fit narrow dark screens', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('n1-theme', JSON.stringify('dark')))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/?live-unit=${unitId}#live-reactions`)
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByLabel('选择学习单元', { exact: true })).toHaveValue(unitId)
  await page.getByLabel('选择知识组', { exact: true }).selectOption(unit.groups.at(-1)!.id)
  await page.locator('[data-live-group]').scrollIntoViewIfNeeded()
  await mkdir(evidence, { recursive: true })
  await page.screenshot({ path: `${evidence}/mobile-dark.png` })
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})
