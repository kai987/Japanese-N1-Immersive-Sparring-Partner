import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })
async function openVocabulary(page: Page) {
  await page.goto('/')
  await navigation(page).getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await expect(page.locator('.learning-card').first()).toBeVisible()
}
const marks = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('n1-progress')!).vocab as Record<string, string>)

test('two tabs retain simultaneous marks, synchronize visible state and honor explicit unmarking', async ({ context }) => {
  const a = await context.newPage(), b = await context.newPage()
  await Promise.all([openVocabulary(a), openVocabulary(b)])
  await Promise.all([
    a.locator('.learning-card').nth(0).getByRole('button', { name: '習得済み', exact: true }).click(),
    b.locator('.learning-card').nth(1).getByRole('button', { name: '習得済み', exact: true }).click(),
  ])
  await expect.poll(async () => Object.values(await marks(a)).filter(status => status === 'mastered').length).toBe(2)
  await expect(a.locator('.learning-card').nth(1).getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
  await expect(b.locator('.learning-card').nth(0).getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
  await a.locator('.learning-card').nth(0).getByRole('button', { name: '習得済み', exact: true }).click()
  await expect(b.locator('.learning-card').nth(0).getByRole('button', { name: '習得済み', exact: true })).not.toHaveClass(/active/)
  await expect(b.locator('.learning-card').nth(1).getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
  await a.reload(); await navigation(a).getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await expect(a.locator('.learning-card').nth(1).getByRole('button', { name: '習得済み', exact: true })).toHaveClass(/active/)
})

test('delayed cross-tab notifications cannot discard either submitted reading attempt', async ({ context }) => {
  // Delay delivery only, as can happen to a background tab. Real localStorage
  // writes, journals and the normal submit handlers still run in both pages.
  await context.addInitScript(() => {
    const original = window.addEventListener
    const pending: (() => void)[] = []
    const state = window as unknown as { holdRecordEvents: boolean; resumeRecordEvents: () => void }
    state.holdRecordEvents = true
    state.resumeRecordEvents = () => { state.holdRecordEvents = false; pending.splice(0).forEach(deliver => deliver()) }
    window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
      if (!listener) return
      if (type === 'storage' && listener) {
        const deliver = (event: Event) => typeof listener === 'function' ? listener.call(window, event) : listener.handleEvent(event)
        return original.call(window, type, event => { if (state.holdRecordEvents) pending.push(() => deliver(event)); else deliver(event) }, options)
      }
      return original.call(window, type, listener, options)
    } as typeof window.addEventListener
  })
  const a = await context.newPage(), b = await context.newPage()
  await Promise.all([a.goto('/'), b.goto('/')])
  for (const page of [a, b]) await navigation(page).getByRole('button', { name: '読解練習', exact: true }).click()
  await a.locator('.answer-option').nth(0).click(); await b.locator('.answer-option').nth(1).click()
  await Promise.all([a.getByRole('button', { name: '回答する', exact: true }).click(), b.getByRole('button', { name: '回答する', exact: true }).click()])
  for (const page of [a, b]) await page.evaluate(() => (window as unknown as { resumeRecordEvents: () => void }).resumeRecordEvents())
  await expect(a.getByText('回答履歴（2回）', { exact: true })).toBeVisible()
  await expect(b.getByText('回答履歴（2回）', { exact: true })).toBeVisible()
  const history = await a.evaluate(() => Object.values(JSON.parse(localStorage.getItem('n1-progress')!).readingAttempts)[0] as { answer: number }[])
  expect(history).toHaveLength(2)
  expect(new Set(history.map(item => item.answer)).size).toBe(2)
})

test('local backup exports actual records and previews a non-destructive validated import', async ({ page }) => {
  const mutations: string[] = []
  page.on('request', request => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutations.push(request.url()) })
  await openVocabulary(page)
  await page.locator('.learning-card').first().getByRole('button', { name: '習得済み', exact: true }).click()
  const first = Object.keys(await marks(page))[0]
  await navigation(page).getByRole('button', { name: '学習履歴', exact: true }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '学習記録をエクスポート', exact: true }).click()])
  const path = await download.path()
  if (!path) throw new Error('No local backup file')
  const backup = JSON.parse(await readFile(path, 'utf8'))
  expect(backup.application).toBe('japanese-n1-learning-records')
  expect(backup.records['n1-progress'].vocab[first]).toBe('mastered')
  backup.records['n1-progress'].vocab[first] = 'new'
  backup.records['n1-progress'].vocab['backup-only-valid-id'] = 'review'
  const input = page.getByLabel('学習記録ファイルを選択', { exact: true })
  await input.setInputFiles({ name: 'learning-records.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  await expect(page.getByRole('heading', { name: '取り込み内容を確認', exact: true })).toBeVisible()
  expect((await marks(page))['backup-only-valid-id']).toBeUndefined()
  await page.getByRole('button', { name: '確認して取り込む', exact: true }).click()
  await expect.poll(async () => (await marks(page))['backup-only-valid-id']).toBe('review')
  expect((await marks(page))[first]).toBe('mastered')
  const before = await marks(page)
  await input.setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') })
  await expect(page.getByRole('alert')).toContainText('JSONファイルを読み込めませんでした')
  expect(await marks(page)).toEqual(before)
  expect(mutations).toEqual([])
})
