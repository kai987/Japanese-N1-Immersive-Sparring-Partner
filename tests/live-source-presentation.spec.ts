import { test, expect } from '@playwright/test'
import { liveUnits } from '../src/data/live-reaction-units.ts'

// Counts come from the source audit, independently of the rendering helper.
// Removing a repeated quote must not remove a study group or one of its entries.
const auditedUnits = [
  { id: '2026-11-23', groups: 23, entries: 57, quotes: 0 },
  { id: '2026-11-18', groups: 40, entries: 84, quotes: 0 },
  { id: '2026-11-13', groups: 29, entries: 77, quotes: 0 },
  { id: '2026-11-09', groups: 11, entries: 60, quotes: 0 },
  { id: '2026-11-05', groups: 25, entries: 63, quotes: 0 },
  { id: '2026-11-04', groups: 24, entries: 73, quotes: 0 },
  { id: '2026-11-03', groups: 32, entries: 74, quotes: 0 },
  { id: '2026-10-30', groups: 32, entries: 69, quotes: 0 },
  { id: '2026-10-29', groups: 16, entries: 35, quotes: 0 },
  { id: '2026-09-30-okashi-bokuso', groups: 28, entries: 47, quotes: 25 },
  { id: '2026-09-28', groups: 15, entries: 64, quotes: 0 },
] as const

// Automatically include future units, not just an enumerated set of dates.
// The data's explicit opt-ins (not the rendering helper) determine the count.
const auditedIds = new Set<string>(auditedUnits.map(unit => unit.id))
const futureUnits = liveUnits.filter(unit => !auditedIds.has(unit.id)).map(unit => ({
  id: unit.id,
  groups: unit.groups.length,
  entries: unit.groups.reduce((count, group) => count + group.entries.length, 0),
  quotes: unit.groups.filter(group => group.source?.contextReason?.trim()).length,
}))
for (const unit of [...auditedUnits, ...futureUnits]) {
  test(`${unit.id} retains every study entry and only independent source context`, async ({ page }) => {
    await page.goto(`/?live-unit=${unit.id}#live-reactions`)
    await expect(page.locator('.live-page')).toHaveAttribute('data-live-unit', unit.id)
    await expect(page.locator('[data-live-group]')).toHaveCount(unit.groups)
    await expect(page.locator('.live-entry')).toHaveCount(unit.entries)
    await expect(page.locator('.live-entry .audio-play-button')).toHaveCount(unit.entries)
    await expect(page.locator('.live-source-quote')).toHaveCount(unit.quotes)
    if (unit.id === '2026-09-30-okashi-bokuso') {
      for (const id of ['exhaust', 'request', 'yashinai']) {
        await expect(page.locator(`[data-live-group="live-2026-09-30-${id}"] .live-source-quote`)).toHaveCount(0)
      }
      await expect(page.locator('[data-live-group="live-2026-09-30-hatashite"] .live-source-quote')).toContainText('はたしてまた会えるだろうか')
      await expect(page.locator('[data-live-group="live-2026-09-30-atarimae"] .live-source-quote')).toContainText('ずいぶん当たり前のこと')
      await expect(page.locator('[data-live-group="live-2026-09-30-kau"] .live-source-quote')).toContainText('この草でチョコをかうんだ。')
    }
    if (unit.id === '2026-11-04') {
      const correction = page.locator('[data-live-group="live-2026-11-04-location-and-eco"] .live-entry-note').last()
      await expect(correction).toContainText('照片写作「環境にやかしい家電製品」')
      await expect(correction).toContainText('词条采用常用写法「環境にやさしい家電製品」')
    }
  })
}

const extractGroup = 'live-2026-10-30-extract'
for (const width of [1440, 390]) {
  test(`the repeated extract note is removed while both learning entries remain usable at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/?live-unit=2026-10-30#live-reactions')
    await page.getByLabel('选择知识组', { exact: true }).selectOption(extractGroup)
    await expect(page.locator('[data-live-group]')).toHaveCount(1)
    const card = page.locator(`[data-live-group="${extractGroup}"]`)
    await expect(card.locator('.live-source-quote')).toHaveCount(0)
    await expect(card.locator('.live-entry')).toHaveCount(2)
    await expect(card.locator('.live-entry dt strong')).toHaveText(['一部を抜き出す', '授業を抜け出す'])
    await expect(card.locator('.live-reading')).toHaveText(['いちぶをぬきだす', 'じゅぎょうをぬけだす'])
    await expect(card.locator('.live-entry dd > p')).toHaveText(['摘出、抽取其中一部分', '从课堂中溜出去、临时离开课堂'])
    const audio = card.locator('.live-entry .audio-play-button')
    await expect(audio).toHaveCount(2)
    await expect(audio.nth(0)).toBeEnabled()
    await expect(audio.nth(1)).toBeEnabled()
    await expect(card.locator('.live-points')).toContainText('不因为有「を」就判成他动词')
    await expect(card.locator('.live-examples .example-box')).toHaveCount(2)
    await card.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    expect(errors).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`live-source-extract-${width}.png`) })
  })
}

test('global search locates the remaining entry after its duplicated source block is removed', async ({ page }) => {
  await page.goto('/?live-unit=2026-09-30-okashi-bokuso#live-reactions')
  await page.getByRole('group', { name: '筛选学习状态', exact: true }).getByRole('button', { name: '習得済み', exact: true }).click()
  const search = page.getByRole('textbox', { name: '全站搜索', exact: true })
  await search.fill('一部を抜き出す')
  const results = page.getByRole('region', { name: '教材の検索結果', exact: true })
  await results.locator(`[data-search-kind="live"][data-search-target="${extractGroup}"]`).click()
  await expect(page.locator('.live-page')).toHaveAttribute('data-live-unit', '2026-10-30')
  await expect(page.getByLabel('选择知识组', { exact: true })).toHaveValue('all')
  const card = page.locator(`[data-live-group="${extractGroup}"]`)
  await expect(card.locator('.live-source-quote')).toHaveCount(0)
  const hit = card.locator('.live-entry dt strong mark.search-hit')
  await expect(hit).toHaveText('一部を抜き出す')
  await expect(hit).toBeInViewport()
  const [match, header] = await Promise.all([hit.boundingBox(), page.locator('.topbar').boundingBox()])
  expect(match!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
  await expect(results).toHaveCount(0)
})

for (const width of [1440, 390]) {
  test(`November 23 no-effect group never repeats its notes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto('/?live-unit=2026-11-23#live-reactions')
    await page.getByLabel('选择知识组', { exact: true }).selectOption('live-2026-11-23-no-effect')
    const card = page.locator('[data-live-group="live-2026-11-23-no-effect"]')
    await expect(card).toHaveCount(1)
    await expect(card.locator('.live-source-quote')).toHaveCount(0)
    await expect(card.locator('.live-entry dt strong')).toHaveText(['私には効かない', '効き目がない'])
    await expect(card.locator('.live-reading')).toHaveText(['わたしにはきかない', 'ききめがない'])
    await expect(card.locator('.live-entry dd > p')).toHaveText(['对我不起作用', '没有效果、没有起作用'])
    await expect(card.locator('.live-entry .audio-play-button')).toHaveCount(2)
    await expect(card.locator('.live-entry-note')).toContainText('「には」')
    await expect(card.locator('.live-points')).toContainText('効き目')
    await expect(card.locator('.live-examples .example-box')).toHaveCount(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
}
