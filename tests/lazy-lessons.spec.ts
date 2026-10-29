import { test, expect } from '@playwright/test'

// Browser plugin not available: prove production data boundaries in Playwright.
const vocabulary = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: 'N1 語彙', exact: true })

test('first screen skips archived lessons/search data; opening a date fetches only that verified lesson', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/')
  await expect(page.locator('.hero h1')).toBeVisible()
  expect(requests.filter(url => /\/assets\/n1-lesson-2026-\d{2}-\d{2}-.*\.json/.test(url))).toEqual([])
  expect(requests.some(url => /n1-search-index-.*\.json/.test(url))).toBe(false)
  await vocabulary(page).click()
  await page.locator('.date-dropdown-trigger').click()
  await page.getByRole('option', { name: /^Day 20\b/ }).click()
  await expect(page.locator('.date-dropdown-trigger')).toContainText('2026年9月18日')
  await expect(page.locator('.learning-card')).not.toHaveCount(0)
  await expect(page.locator('.lesson-loading')).toHaveCount(0)
  expect(requests.filter(url => /\/assets\/n1-lesson-2026-\d{2}-\d{2}-.*\.json/.test(url))).toHaveLength(1)
  expect(requests.some(url => /\/assets\/n1-lesson-2026-09-18-.*\.json/.test(url))).toBe(true)
  await page.getByRole('textbox', { name: '全站搜索', exact: true }).fill('間に合う')
  await expect(page.getByRole('region', { name: '教材の検索結果', exact: true })).toBeVisible()
  await expect.poll(() => requests.some(url => url.includes('n1-search-index'))).toBe(true)
})

test('a failed historical data request cannot expose the old date as the requested lesson and retry preserves progress', async ({ page }) => {
  let deny = true
  let attempts = 0
  await page.route('**/assets/n1-lesson-2026-09-18-*.json', route => {
    attempts++
    return deny ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Temporarily unavailable"}' }) : route.continue()
  })
  await page.goto('/')
  await vocabulary(page).click()
  await page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true }).click()
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('n1-progress')!))
  await page.locator('.date-dropdown-trigger').click()
  await page.getByRole('option', { name: /^Day 20\b/ }).click()
  await expect(page.getByRole('alert')).toContainText('この日の教材を読み込めませんでした')
  await expect(page.locator('.learning-card')).toHaveCount(0)
  deny = false
  await page.getByRole('button', { name: '教材を再読み込み', exact: true }).click()
  await expect(page.locator('.learning-card')).not.toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(attempts).toBe(2)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('n1-progress')!))).toEqual(before)
})
