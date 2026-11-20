import { test, expect, type Page } from '@playwright/test'
import { liveUnits } from '../src/data/live-reaction-units.ts'

const supportedUnits = ['2026-10-29', '2026-10-30']
const pageIds = ['cover', ...Array.from({ length: 15 }, (_, index) => `page-${String(index + 29).padStart(3, '0')}`)]
const pageLabels = ['标题页', ...Array.from({ length: 15 }, (_, index) => `第${index + 29}页`)]
const optionLabels = pageLabels.map((label, index) => `${index + 1} / 16 · ${label}`)
const gallery = (page: Page) => page.locator('details.live-manga-gallery')
const unitPicker = (page: Page) => page.getByLabel('选择学习单元', { exact: true })
const mangaPicker = (page: Page) => gallery(page).getByLabel('选择漫画页', { exact: true })
const learningKeys = ['n1-progress', 'n1-completed-lessons', 'n1-live-reactions-progress-v1']
const learningRecords = (page: Page) => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), learningKeys)

async function openGallery(page: Page) {
  await gallery(page).locator('summary').click()
  await expect(gallery(page)).toHaveAttribute('open')
  await expect(mangaPicker(page).locator('option')).toHaveText(optionLabels)
}

async function expectLoadedPage(page: Page, id: string) {
  const index = pageIds.indexOf(id)
  await expect(mangaPicker(page)).toHaveValue(id)
  await expect(gallery(page).getByRole('status')).toHaveText(`第 ${index + 1} / 16 张 · ${pageLabels[index]}`)
  const image = gallery(page).locator('img')
  await image.scrollIntoViewIfNeeded()
  await expect(image).toHaveAttribute('width', '1352')
  await expect(image).toHaveAttribute('height', '1920')
  await expect(image).toHaveJSProperty('naturalWidth', 1352)
  await expect(image).toHaveJSProperty('naturalHeight', 1920)
  await expect(image).toHaveJSProperty('complete', true)
  return image
}

test('both October units share an ordered, lazy 16-page gallery and verified build assets', async ({ page }) => {
  expect(liveUnits.filter(unit => unit.manga).map(unit => unit.id).sort()).toEqual(supportedUnits)
  for (const id of supportedUnits) {
    expect(liveUnits.find(unit => unit.id === id)!.manga!.pages.map(item => item.id)).toEqual(pageIds)
  }

  const release = await page.request.get('/n1-release.json')
  expect(release.ok()).toBe(true)
  const manifest = await release.json() as { files: Record<string, { sha256: string; bytes: number }> }
  const imageAssets = Object.keys(manifest.files).filter(path => /^assets\/(?:cover|page-(?:029|03\d|04[0-3]))-[\w-]+\.jpg$/.test(path))
  expect(imageAssets).toHaveLength(16)
  for (const id of pageIds) {
    const matches = imageAssets.filter(path => path.startsWith(`assets/${id}-`))
    expect(matches).toHaveLength(1)
    expect(manifest.files[matches[0]].sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(manifest.files[matches[0]].bytes).toBeGreaterThan(0)
  }

  const imageRequests: string[] = []
  page.on('request', request => { if (/\.jpg(?:\?|$)/i.test(request.url())) imageRequests.push(request.url()) })
  await page.goto('/?live-unit=2026-10-29#live-reactions')
  await expect(unitPicker(page)).toHaveValue('2026-10-29')
  await expect(gallery(page).locator('summary')).toHaveText('漫画原图 · 16 张')
  await expect(gallery(page)).not.toHaveAttribute('open')
  await expect(gallery(page).locator('img')).toHaveCount(0)
  expect(imageRequests).toEqual([])

  await openGallery(page)
  await expect(gallery(page).getByRole('heading', { name: 'タンポポ空を行く', exact: true })).toBeVisible()
  const image = await expectLoadedPage(page, 'cover')
  const coverSource = await image.getAttribute('src')
  expect(imageRequests).toHaveLength(1)
  await expect(gallery(page).getByRole('button', { name: '上一页', exact: true })).toBeDisabled()
  await expect(gallery(page).getByRole('link', { name: '打开原图', exact: true })).toHaveAttribute('href', coverSource!)
  await gallery(page).getByRole('button', { name: '下一页', exact: true }).click()
  await expectLoadedPage(page, 'page-029')
  await expect(gallery(page).getByRole('button', { name: '上一页', exact: true })).toBeEnabled()
  await mangaPicker(page).selectOption('page-043')
  await expectLoadedPage(page, 'page-043')
  await expect(gallery(page).getByRole('button', { name: '下一页', exact: true })).toBeDisabled()
  await gallery(page).locator('summary').click()
  await expect(gallery(page).locator('img')).toHaveCount(0)

  await unitPicker(page).selectOption('2026-10-30')
  await expect(gallery(page)).not.toHaveAttribute('open')
  await expect(gallery(page).locator('img')).toHaveCount(0)
  await openGallery(page)
  await expectLoadedPage(page, 'cover')
  await expect(gallery(page).locator('img')).toHaveAttribute('src', coverSource!)
  await unitPicker(page).selectOption('2026-11-18')
  await expect(gallery(page)).toHaveCount(0)
})

test('page-turn buttons float over the left and right edges of the manga at desktop and mobile widths', async ({ page }) => {
  await page.goto('/?live-unit=2026-10-29#live-reactions')
  await openGallery(page)
  const previous = gallery(page).getByRole('button', { name: '上一页', exact: true })
  const next = gallery(page).getByRole('button', { name: '下一页', exact: true })
  const image = await expectLoadedPage(page, 'cover')

  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await image.scrollIntoViewIfNeeded()
    const [selectBox, previousBox, imageBox, nextBox] = await Promise.all([
      mangaPicker(page).boundingBox(), previous.boundingBox(), image.boundingBox(), next.boundingBox(),
    ])
    expect(selectBox).not.toBeNull()
    expect(previousBox).not.toBeNull()
    expect(imageBox).not.toBeNull()
    expect(nextBox).not.toBeNull()
    const [picker, left, picture, right] = [selectBox!, previousBox!, imageBox!, nextBox!]
    expect(left.y).toBeGreaterThan(picker.y + picker.height)
    expect(right.y).toBeGreaterThan(picker.y + picker.height)
    expect(Math.abs(left.y + left.height / 2 - picture.y - picture.height / 2)).toBeLessThan(3)
    expect(Math.abs(right.y + right.height / 2 - picture.y - picture.height / 2)).toBeLessThan(3)
    // Both arrows overlay the displayed image, rather than consuming space beside it.
    expect(left.x).toBeGreaterThanOrEqual(picture.x)
    expect(left.x + left.width).toBeLessThan(picture.x + picture.width / 3)
    expect(right.x).toBeGreaterThan(picture.x + picture.width * 2 / 3)
    expect(right.x + right.width).toBeLessThanOrEqual(picture.x + picture.width)
    expect(picture.width).toBeGreaterThan(180)
    const reader = await gallery(page).locator('.live-manga-navigation').boundingBox()
    expect(reader).not.toBeNull()
    expect(Math.abs(reader!.width - picture.width)).toBeLessThan(3)
  }
  await next.click()
  await expectLoadedPage(page, 'page-029')
  await previous.click()
  await expectLoadedPage(page, 'cover')
})

test('manga arrows keep 60% transparent backgrounds and become 90% opaque on hover', async ({ page }) => {
  await page.goto('/?live-unit=2026-10-29#live-reactions')
  await openGallery(page)
  const next = gallery(page).getByRole('button', { name: '下一页', exact: true })
  await expectLoadedPage(page, 'cover')

  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    const expectedColors = await page.evaluate(() => {
      const container = document.querySelector('.live-manga-navigation')!
      const probe = document.createElement('span')
      container.appendChild(probe)
      const getMixedColor = (percent: number) => {
        probe.style.backgroundColor = `color-mix(in srgb, var(--surface) ${percent}%, transparent)`
        return getComputedStyle(probe).backgroundColor
      }
      const colors = { idle: getMixedColor(40), hover: getMixedColor(90) }
      probe.remove()
      return colors
    })
    await expect(next).toHaveCSS('background-color', expectedColors.idle)
    await expect(next).toHaveCSS('opacity', '1')
    await next.hover()
    await expect(next).toHaveCSS('background-color', expectedColors.hover)
    await page.mouse.move(0, 0)
    await expect(next).toHaveCSS('background-color', expectedColors.idle)
  }

  await next.click()
  await expectLoadedPage(page, 'page-029')
})

test('viewing pages and switching units preserve live marks and daily learning records', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('n1-live-reactions-progress-v1')) {
      localStorage.setItem('n1-live-reactions-progress-v1', JSON.stringify({ version: 1, groups: {
        'live-2026-10-29-dore-dakke': 'review',
        'live-2026-10-30-extract': 'mastered',
        'live-2026-09-28-endurance': 'mastered',
      } }))
    }
    if (!localStorage.getItem('n1-completed-lessons')) {
      localStorage.setItem('n1-completed-lessons', JSON.stringify({ '2026-09-28': true }))
    }
  })
  await page.goto('/?live-unit=2026-10-29')
  const navigation = page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
  await navigation.getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true }).click()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('n1-progress'))).toContain('mastered')
  await navigation.getByRole('button', { name: '直播条反', exact: true }).click()
  await expect(page.locator('[data-live-group="live-2026-10-29-dore-dakke"]').getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const before = await learningRecords(page)

  await openGallery(page)
  await mangaPicker(page).selectOption('page-032')
  await expectLoadedPage(page, 'page-032')
  await unitPicker(page).selectOption('2026-10-30')
  await expect(page.locator('[data-live-group="live-2026-10-30-extract"]').getByRole('button', { name: '習得済み', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await openGallery(page)
  await mangaPicker(page).selectOption('page-043')
  await expectLoadedPage(page, 'page-043')
  await unitPicker(page).selectOption('2026-11-18')
  await expect(gallery(page)).toHaveCount(0)
  await unitPicker(page).selectOption('2026-10-29')
  await page.reload()
  await expect(unitPicker(page)).toHaveValue('2026-10-29')
  await expect(page.locator('[data-live-group="live-2026-10-29-dore-dakke"]').getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await learningRecords(page)).toEqual(before)
})

test('mobile reader recovers one failed JPEG and fits 390px and 320px screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const attempts: string[] = []
  await page.route(/\.jpg(?:\?.*)?$/i, route => {
    attempts.push(route.request().url())
    return attempts.length === 1
      ? route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporarily unavailable' })
      : route.continue()
  })
  await page.goto('/?live-unit=2026-10-30#live-reactions')
  await openGallery(page)
  await gallery(page).locator('.live-manga-page').scrollIntoViewIfNeeded()
  await expect(gallery(page).getByRole('alert')).toContainText('这张漫画原图未能加载')
  await expect(gallery(page).locator('img')).toHaveCount(0)
  expect(attempts).toHaveLength(1)
  await gallery(page).getByRole('button', { name: '重试加载', exact: true }).click()
  const image = await expectLoadedPage(page, 'cover')
  await expect(gallery(page).getByRole('alert')).toHaveCount(0)
  expect(attempts).toHaveLength(2)
  expect(new URL(attempts[1]).pathname).toBe(new URL(attempts[0]).pathname)
  expect(attempts[1]).not.toBe(attempts[0])

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    for (const control of [mangaPicker(page), gallery(page).getByRole('button', { name: '上一页', exact: true }), gallery(page).getByRole('button', { name: '下一页', exact: true })]) {
      await expect(control).toBeVisible()
      const bounds = await control.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
    }
    const bounds = await image.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.width).toBeGreaterThan(0)
    expect(bounds!.width).toBeLessThan(width)
    expect(bounds!.width / bounds!.height).toBeCloseTo(1352 / 1920, 2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await mangaPicker(page).selectOption('page-043')
  await expectLoadedPage(page, 'page-043')
  await expect(gallery(page).getByRole('button', { name: '下一页', exact: true })).toBeDisabled()
})
