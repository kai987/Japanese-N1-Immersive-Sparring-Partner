import { test, expect, type Page } from '@playwright/test'
import { compoundVerbSeries } from '../src/data/compound-verbs.ts'

// Browser plugin is unavailable in this session; use the configured Playwright browser.
const searchbox = (page: Page) => page.getByRole('textbox', { name: '全站搜索', exact: true })
const detail = (page: Page, id: string) => page.locator(`article.compound-detail[data-series-id="${id}"]`)
const currentHit = (page: Page) => page.locator('.compound-detail mark.compound-search-hit.is-current[aria-current="true"]')
const hits = (page: Page) => page.locator('.compound-detail mark.compound-search-hit')
const previous = (page: Page) => page.getByRole('button', { name: '前の一致へ', exact: true })
const next = (page: Page) => page.getByRole('button', { name: '次の一致へ', exact: true })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

async function activeIndex(page: Page) {
  return hits(page).evaluateAll(elements => elements.findIndex(element => element.getAttribute('aria-current') === 'true'))
}

async function expectCurrentVisible(page: Page) {
  await expect(currentHit(page)).toHaveCount(1)
  await expect(currentHit(page)).toBeInViewport()
  // Sticky search must not hide the exact text to which the user was taken.
  await expect.poll(async () => {
    const [hit, toolbar] = await Promise.all([currentHit(page).boundingBox(), page.locator('.compound-search').boundingBox()])
    return !!hit && !!toolbar && hit.y >= toolbar.y + toolbar.height - 1 && hit.y + hit.height <= await page.evaluate(() => innerHeight)
  }).toBe(true)
}

test('typing a deep keyword selects its series, highlights and scrolls, and previous/next navigate matches', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/#compound-verbs/au')
  const search = searchbox(page)
  await search.fill('折り返す')
  await expect(detail(page, 'naosu-kaesu')).toBeVisible()
  await expect(page).toHaveURL(/#compound-verbs\/naosu-kaesu$/)
  await expect(search).toHaveValue('折り返す')
  await expect(search).toBeFocused()
  await expectCurrentVisible(page)
  await expect(currentHit(page)).toHaveText('折り返す')
  expect(await hits(page).count()).toBeGreaterThan(1)
  await expect(page.getByRole('status')).toContainText(/1\s*\/\s*\d+/)
  expect(await activeIndex(page)).toBe(0)
  await next(page).click()
  await expect.poll(() => activeIndex(page)).toBe(1)
  await expectCurrentVisible(page)
  await expect(page.getByRole('status')).toContainText(/2\s*\/\s*\d+/)
  await previous(page).click()
  await expect.poll(() => activeIndex(page)).toBe(0)
  await expectCurrentVisible(page)
  await search.focus()
  await search.press('Escape')
  await search.press('Enter')
  await expect.poll(() => activeIndex(page)).toBe(1)
  await expectCurrentVisible(page)
  await search.press('Shift+Enter')
  await expect.poll(() => activeIndex(page)).toBe(0)
  await expectCurrentVisible(page)
  await expect(search).toBeFocused()
  await expect(search).toHaveValue('折り返す')
  expect(errors).toEqual([])
})

test('switching between matching series preserves the query and lands on a highlight', async ({ page }) => {
  await page.goto('/#compound-verbs/au')
  await searchbox(page).fill('間に合う')
  await expectCurrentVisible(page)
  await expect(page.locator('.compound-series-button')).toHaveCount(2)
  await page.locator('.compound-series-button[data-series-id="time-quantity"]').click()
  await expect(detail(page, 'time-quantity')).toBeVisible()
  await expect(searchbox(page)).toHaveValue('間に合う')
  await expect(page.locator('.compound-series-button')).toHaveCount(2)
  await expectCurrentVisible(page)
  await expect(currentHit(page)).toHaveText('間に合う')
  await expect.poll(() => activeIndex(page)).toBe(0)
})

test('readings and Chinese meanings are highlighted where they appear in the selected series', async ({ page }) => {
  await page.goto('/#compound-verbs/au')
  await searchbox(page).fill('おりかえす')
  await expect(detail(page, 'naosu-kaesu')).toBeVisible()
  await expectCurrentVisible(page)
  await expect(currentHit(page)).toHaveText('おりかえす')
  await searchbox(page).fill('回电')
  await expect(detail(page, 'naosu-kaesu')).toBeVisible()
  await expectCurrentVisible(page)
  await expect(currentHit(page)).toHaveText('回电')
})

test('clearing search removes marks and no-result text stays safe and recoverable', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/#compound-verbs/au')
  await searchbox(page).fill('間に合う')
  await expectCurrentVisible(page)
  await page.getByRole('button', { name: '検索をクリア', exact: true }).click()
  await expect(searchbox(page)).toHaveValue('')
  await expect(page.locator('mark.compound-search-hit')).toHaveCount(0)
  await expect(page.locator('.compound-series-button')).toHaveCount(compoundVerbSeries.length)
  await searchbox(page).fill('<img src=x onerror=alert(1)> [.*] no-match')
  await expect(page.getByRole('heading', { name: '没有找到相关系列', exact: true })).toBeVisible()
  await expect(page.locator('.compound-series-button')).toHaveCount(0)
  await expect(page.locator('mark.compound-search-hit')).toHaveCount(0)
  await page.getByRole('button', { name: '検索をクリア', exact: true }).click()
  await expect(page.locator('.compound-series-button')).toHaveCount(compoundVerbSeries.length)
  expect(errors).toEqual([])
})

test('IME composition does not scroll before committing a Japanese keyword', async ({ page }) => {
  await page.goto('/#compound-verbs/au')
  const search = searchbox(page)
  await expect(search).toBeVisible()
  await search.focus()
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView
    Object.assign(window, { compoundSearchScrollCalls: 0 })
    Element.prototype.scrollIntoView = function (...args) {
      if (this.closest('.compound-page')) {
        const calls = window as typeof window & { compoundSearchScrollCalls: number }
        calls.compoundSearchScrollCalls += 1
      }
      return original.apply(this, args)
    }
  })
  await search.dispatchEvent('compositionstart', { data: '' })
  await search.fill('折り返す')
  await search.dispatchEvent('compositionupdate', { data: '折り返す' })
  // This negative timing check spans the entire 350ms search debounce.
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => (window as typeof window & { compoundSearchScrollCalls: number }).compoundSearchScrollCalls)).toBe(0)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await expect(search).toBeFocused()
  await search.dispatchEvent('compositionend', { data: '折り返す' })
  await expect(detail(page, 'naosu-kaesu')).toBeVisible()
  await expectCurrentVisible(page)
})

test('IME replacement keeps the existing deep result and scroll position until composition ends', async ({ page }) => {
  await page.goto('/#compound-verbs/au')
  const search = searchbox(page)
  await search.fill('おりかえす')
  await expect(detail(page, 'naosu-kaesu')).toBeVisible()
  await expectCurrentVisible(page)
  await expect(currentHit(page)).toHaveText('おりかえす')
  const before = await page.evaluate(() => scrollY)
  expect(before).toBeGreaterThan(1000)
  await expect(search).toBeInViewport()
  await search.dispatchEvent('compositionstart', { data: '' })
  // Dispatch a native input event without Playwright refocusing/scrolling the
  // sticky input, so this detects browser scroll clamping when results vanish.
  await search.evaluate(element => {
    const input = element as HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setValue.call(input, '間に合う')
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '間に合う', inputType: 'insertCompositionText', isComposing: true }))
  })
  await search.dispatchEvent('compositionupdate', { data: '間に合う' })
  await expect(search).toHaveValue('間に合う')
  await page.waitForTimeout(500)
  await expect(detail(page, 'naosu-kaesu')).toBeVisible()
  await expect(currentHit(page)).toHaveText('おりかえす')
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(8)
  await search.dispatchEvent('compositionend', { data: '間に合う' })
  await expect(page.locator('.compound-detail')).toHaveAttribute('data-series-id', /^(?:au|time-quantity)$/)
  await expectCurrentVisible(page)
  await expect(currentHit(page)).toHaveText('間に合う')
})

test('browsing series without a query leaves each new heading below sticky search on desktop and mobile', async ({ page }) => {
  const relatedId = compoundVerbSeries.find(series => series.id === 'komu')!.relatedSeriesIds[0]
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    await page.goto('/#compound-verbs/au')
    await expect(searchbox(page)).toHaveValue('')
    await page.locator('.compound-series-button[data-series-id="komu"]').click()
    for (const id of ['komu', relatedId]) {
      if (id === relatedId) await detail(page, 'komu').locator('.compound-related button').first().click()
      const heading = detail(page, id).locator('.compound-detail-head h2')
      await expect(heading).toBeInViewport()
      await expect.poll(async () => {
        const [title, toolbar] = await Promise.all([heading.boundingBox(), page.locator('.compound-search').boundingBox()])
        return !!title && !!toolbar && title.y > toolbar.y + toolbar.height && title.y + title.height <= await page.evaluate(() => innerHeight)
      }).toBe(true)
      await expect(searchbox(page)).toHaveValue('')
    }
  }
})

test('390px dark search remains sticky and match navigation does not cause horizontal overflow', async ({ page }, testInfo) => {
  const errors = watchErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('n1-theme', JSON.stringify('dark')))
  await page.goto('/#compound-verbs/au')
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark')
  await searchbox(page).fill('折り返す')
  await expectCurrentVisible(page)
  await expect(searchbox(page)).toBeInViewport()
  await expect(next(page)).toBeInViewport()
  expect(await page.locator('.compound-search').evaluate(element => getComputedStyle(element).position)).toBe('sticky')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await next(page).click()
  await expect.poll(() => activeIndex(page)).toBe(1)
  await expectCurrentVisible(page)
  await expect(searchbox(page)).toBeInViewport()
  await expect(previous(page)).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('compound-search-mobile-dark.png') })
  expect(errors).toEqual([])
})
