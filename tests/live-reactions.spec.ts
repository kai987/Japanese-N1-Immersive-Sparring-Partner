import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const base = '/Japanese-N1-Immersive-Sparring-Partner/'
const storageKey = 'n1-live-reactions-progress-v1'
const evidence = '/tmp/n1-improvements-playwright/live-notes'

test('sidebar opens all groups; bilingual search, selection and clear work', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(base)
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: '直播条反', exact: true }).click()
  await expect(page.getByRole('heading', { name: '直播条反', exact: true })).toBeVisible()
  await expect(page.locator('[data-live-group]')).toHaveCount(15)
  await expect(page.locator('.live-entry')).toHaveCount(64)
  await expect(page).toHaveURL(/#live-reactions$/)
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  await mkdir(evidence, { recursive: true })
  await page.screenshot({ path: `${evidence}/desktop.png` })
  await page.getByLabel('搜索本页笔记').fill('果断')
  await expect(page.locator('[data-live-group]')).toHaveCount(1)
  await expect(page.getByText('思い切り殴る', { exact: true })).toBeVisible()
  await page.getByLabel('搜索本页笔记').fill('没有匹配的测试词')
  await expect(page.getByRole('heading', { name: '没有匹配的知识组' })).toBeVisible()
  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.locator('[data-live-group]')).toHaveCount(15)
  await page.getByLabel('选择知识组').selectOption('live-2026-09-28-ki')
  await expect(page.locator('[data-live-group]')).toHaveCount(1)
  await expect(page.getByText('気に入る', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('group status survives reload without changing existing daily records', async ({ page }) => {
  await page.goto(base)
  const nav = page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
  await nav.getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true }).click()
  await expect(page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
  const before = await page.evaluate(() => ({ progress: localStorage.getItem('n1-progress'), completed: localStorage.getItem('n1-completed-lessons') }))
  await nav.getByRole('button', { name: '直播条反', exact: true }).click()
  const first = page.locator('[data-live-group]').first()
  await first.getByRole('button', { name: '要復習', exact: true }).click()
  await expect(first.getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('group', { name: '筛选学习状态', exact: true }).getByRole('button', { name: '要復習', exact: true }).click()
  await expect(page.locator('[data-live-group]')).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('heading', { name: '直播条反', exact: true })).toBeVisible()
  await expect(page.locator('[data-live-group]').first().getByRole('button', { name: '要復習', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('[data-live-group]').first().getByRole('button', { name: '習得済み', exact: true }).click()
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}').groups?.['live-2026-09-28-endurance'], storageKey)).toBe('mastered')
  const after = await page.evaluate(() => ({ progress: localStorage.getItem('n1-progress'), completed: localStorage.getItem('n1-completed-lessons') }))
  expect(after).toEqual(before)
  await nav.getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'N1 語彙', exact: true })).toBeVisible()
  await expect(page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
  await expect(page).not.toHaveURL(/#live-reactions$/)
})

test('mobile sidebar, dark theme, readable cards and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base)
  await page.getByRole('button', { name: 'ナビゲーションを開く', exact: true }).click()
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: '直播条反', exact: true }).click()
  await expect(page.getByRole('heading', { name: '直播条反', exact: true })).toBeVisible()
  await expect(page.locator('.mobile-overlay')).toHaveCount(0)
  await mkdir(evidence, { recursive: true })
  await page.screenshot({ path: `${evidence}/mobile.png` })
  await page.getByRole('button', { name: '読解テーマを切り替える', exact: true }).click()
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark')
  await page.getByLabel('选择知识组').selectOption('live-2026-09-28-ki')
  await page.locator('[data-live-group]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${evidence}/mobile-dark.png` })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})

test('invalid live progress is recovered independently and storage errors are visible', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), storageKey)
  await page.goto(`${base}#live-reactions`)
  await expect(page.getByText('部分直播学习记录无法读取；可读取的记录已保留，每日教材记录不受影响。')).toBeVisible()
  await expect(page.locator('[data-live-group]')).toHaveCount(15)
  await page.evaluate(key => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('blocked', 'QuotaExceededError')
      return original.call(this, name, value)
    }
  }, storageKey)
  await page.locator('[data-live-group]').first().getByRole('button', { name: '要復習', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('无法保存直播笔记的学习状态')
})
