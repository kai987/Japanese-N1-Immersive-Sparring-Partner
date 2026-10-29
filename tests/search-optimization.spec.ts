import { test, expect } from '@playwright/test'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { matchesLiveGroup } from '../src/lib/liveReactions.ts'

// Browser plugin not available; exercise the configured production preview with Playwright.
const search = (page: import('@playwright/test').Page) => page.getByRole('textbox', { name: '全站搜索', exact: true })
const results = (page: import('@playwright/test').Page) => page.getByRole('region', { name: '教材の検索結果', exact: true })

test('precise live expressions lead incidental examples and still open a highlighted card', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await search(page).fill('いけない')
  const first = results(page).locator('[data-search-kind="live"]').first()
  await expect(first).toHaveAttribute('data-search-target', 'live-2026-10-29-prohibition')
  await first.click()
  const card = page.locator('[data-live-group="live-2026-10-29-prohibition"]')
  await expect(card.locator('mark.search-hit').first()).toBeInViewport()
  await expect(results(page)).toHaveCount(0)
  expect(errors).toEqual([])
})

test('all matching notes are accessible with keyboard navigation on a narrow dark screen', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('n1-theme', JSON.stringify('dark')))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const input = search(page)
  await input.fill('ない')
  const liveRows = () => results(page).locator('[data-search-kind="live"]')
  await expect(liveRows()).toHaveCount(4)
  const previews = await liveRows().evaluateAll(rows => rows.map(row => row.getAttribute('data-search-target')))
  await results(page).getByRole('button', { name: /查看全部结果/ }).click()
  const expected = liveUnits.flatMap(unit => unit.groups.filter(group => matchesLiveGroup(group, 'ない'))).length
  await expect(liveRows()).toHaveCount(expected)
  const target = await liveRows().last().getAttribute('data-search-target')
  expect(previews).not.toContain(target)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await expect(input).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await input.press('ArrowUp')
  await expect(liveRows().last()).toHaveClass(/is-selected/)
  await input.press('Enter')
  await expect(page.locator(`[data-live-group="${target}"] mark.search-hit`).first()).toBeInViewport()
  await expect(input).toHaveValue('ない')
  await expect(page.locator('input')).toHaveCount(1)
})

test('a failed lazy load preserves the query and can recover after connectivity returns', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.locator('.hero h1')).toBeVisible()
  await context.setOffline(true)
  await search(page).fill('いけない')
  await expect(results(page).getByText('搜索索引暂时无法加载，已输入的关键词会保留。')).toBeVisible()
  await expect(search(page)).toHaveValue('いけない')
  await context.setOffline(false)
  await results(page).getByRole('button', { name: '重试加载搜索', exact: true }).click()
  await expect(results(page).locator('[data-search-target="live-2026-10-29-prohibition"]')).toBeVisible()
  await page.getByRole('button', { name: '検索をクリア', exact: true }).click()
  await expect(results(page)).toHaveCount(0)
  await expect(search(page)).toHaveValue('')
  await search(page).fill('期待外れ')
  await expect(results(page).locator('[data-search-kind="live"]')).not.toHaveCount(0)
})

test('clearing a query while the JSON index loads cannot restore stale search results', async ({ page }) => {
  let release!: () => void
  const delayed = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route('**/assets/n1-search-index-*.json', async route => {
    requests++
    await delayed
    await route.continue()
  })
  await page.goto('/')
  await search(page).fill('いけない')
  await expect(results(page).getByText('正在加载搜索索引…')).toBeVisible()
  await page.getByRole('button', { name: '検索をクリア', exact: true }).click()
  await expect(search(page)).toHaveValue('')
  const loaded = page.waitForResponse(response => /n1-search-index-.*\.json/.test(response.url()))
  release()
  await loaded
  await expect(results(page)).toHaveCount(0)
  await search(page).fill('期待外れ')
  await expect(results(page).locator('[data-search-kind="live"]')).not.toHaveCount(0)
  await expect(search(page)).toHaveValue('期待外れ')
  expect(requests).toBe(1)
})
