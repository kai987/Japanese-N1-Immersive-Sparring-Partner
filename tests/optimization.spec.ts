import { test, expect, type Page } from '@playwright/test'
import { validateContent } from '../scripts/validate-content.ts'
import { initialProgress } from '../src/lib/progress.ts'
import { getPracticeQuestions } from '../src/lib/practice.ts'
import { practiceHref, questionElementId } from '../src/lib/questionReview.ts'

// Flow: dated lesson -> navigation/answer draft -> refresh -> same learning state.
const lessons = validateContent().lessons
const archived = lessons.at(-1)!
const reference = getPracticeQuestions(archived).find(item => item.category === 'vocabulary')!
const question = reference.question
const href = practiceHref(archived.date, reference.category, question.id)
const element = (page: Page) => page.locator(`[id="${questionElementId(question.id)}"]`)
const nav = (page: Page) => page.getByRole('navigation', { name: 'メインナビゲーション', exact: true })

test('a dated section and unsubmitted canonical choice survive refresh without creating a submission', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/?date=${archived.date}&section=vocabulary`)
  const exercise = element(page)
  const selected = (question.answer + 1) % 4
  await exercise.locator('.answer-option').nth(selected).click()
  const before = await page.evaluate(() => localStorage.getItem('n1-progress'))
  await page.reload()
  await expect(nav(page).getByRole('button', { name: 'N1 語彙', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.date-dropdown-trigger')).toContainText(`Day ${archived.day}`)
  await expect(exercise.locator('.answer-option').nth(selected)).toHaveAttribute('aria-pressed', 'true')
  await expect(exercise.locator('.result-panel')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('n1-progress'))).toBe(before)
  await exercise.getByRole('button', { name: '回答する', exact: true }).click()
  await expect(exercise.locator('.result-panel')).toBeVisible()
  const saved = await page.evaluate(id => JSON.parse(localStorage.getItem('n1-progress')!).readingAttempts[id], question.id)
  expect(saved).toHaveLength(1)
  expect(saved[0].answer).toBe(selected)
  await page.reload()
  await expect(exercise.locator('.result-panel')).toBeVisible()
  expect(await page.evaluate(id => sessionStorage.getItem(`n1-question-draft:${id}`), question.id)).toBeNull()
  expect(errors).toEqual([])
})

test('refreshing a retry keeps its draft separate from the previous submitted answer', async ({ page }) => {
  const wrong = (question.answer + 1) % 4
  const progress = structuredClone(initialProgress)
  progress.readingAnswers[question.id] = wrong
  progress.readingAttempts[question.id] = [{ answer: wrong, at: '2026-11-21T01:00:00Z' }]
  await page.addInitScript(value => {
    if (!localStorage.getItem('n1-progress')) localStorage.setItem('n1-progress', JSON.stringify(value))
  }, progress)
  await page.goto(`/${href}`)
  const exercise = element(page)
  await exercise.getByRole('button', { name: 'もう一度挑戦する', exact: true }).click()
  await exercise.locator('.answer-option').nth(question.answer).click()
  await page.reload()
  await expect(exercise.locator('.retry-note')).toBeVisible()
  await expect(exercise.locator('.answer-option').nth(question.answer)).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem('n1-progress')!).readingAttempts[id].length, question.id)).toBe(1)
  await exercise.getByRole('button', { name: '回答する', exact: true }).click()
  await expect(exercise.locator('.result-title')).toHaveText('正解です')
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem('n1-progress')!).readingAttempts[id].map((attempt: { answer: number }) => attempt.answer), question.id)).toEqual([wrong, question.answer])
})

test('unknown-date links behave the same on startup, hash navigation and reload', async ({ page }) => {
  const broken = '#practice/2027-01-01/reading/missing'
  await page.goto(`/${broken}`)
  await expect(page.getByRole('alert')).toContainText('指定された問題')
  await expect(page).toHaveURL(new RegExp(`${broken}$`))
  await nav(page).getByRole('button', { name: 'N1 文法', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.evaluate(hash => { window.location.hash = hash }, broken)
  await expect(page.getByRole('alert')).toContainText('指定された問題')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('指定された問題')
  await nav(page).getByRole('button', { name: 'N1 語彙', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a failed lazy module keeps navigation usable and refresh resumes the section and search', async ({ page }) => {
  let fail = true
  await page.route(/\/assets\/CompoundVerbs-[^/]+\.js$/, route => fail
    ? route.fulfill({ status: 404, contentType: 'text/javascript', body: '' }) : route.continue())
  await page.goto('/')
  const input = page.getByRole('textbox', { name: '全站搜索', exact: true })
  await input.fill('話し合う')
  await input.press('Escape')
  await nav(page).getByRole('button', { name: '複合動詞', exact: true }).click()
  await expect(page.locator('.resource-error')).toContainText('この画面を読み込めませんでした')
  await expect(nav(page)).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'ページを再読み込み', exact: true }).click()
  await expect(page.locator('.resource-error')).toHaveCount(0)
  await expect(page.locator('.compound-detail')).toBeVisible()
  await expect(input).toHaveValue('話し合う')
  await expect(page).toHaveURL(/#compound-verbs\/au$/)
})

test('an expired historical lesson offers a version refresh and resumes its date', async ({ page }) => {
  let fail = true
  await page.route(new RegExp(`/assets/n1-lesson-${archived.date}-[^/]+\\.json$`), route => fail
    ? route.fulfill({ status: 410, contentType: 'application/json', body: '{}' }) : route.continue())
  await page.goto(`/?date=${archived.date}&section=grammar`)
  await expect(page.getByRole('alert')).toContainText('教材が更新されています')
  fail = false
  await page.getByRole('button', { name: 'ページを再読み込み', exact: true }).click()
  await expect(page.locator('.grammar-list')).toBeVisible()
  await expect(page.locator('.date-dropdown-trigger')).toContainText(`Day ${archived.day}`)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('initial loading and independent pages request only their current audio metadata', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => { if (/\/n1-audio-[^/]+\.json$/.test(request.url())) requests.push(request.url()) })
  await page.goto('/')
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0]).toContain(`n1-audio-lesson-${lessons[0].date}-`)
  await nav(page).getByRole('button', { name: '複合動詞', exact: true }).click()
  await expect(page.locator('.compound-detail')).toBeVisible()
  await expect.poll(() => requests.filter(url => url.includes('n1-audio-compound-au-')).length).toBe(1)
  await nav(page).getByRole('button', { name: '直播条反', exact: true }).click()
  await expect(page.getByLabel('选择学习单元', { exact: true })).toBeVisible()
  await expect.poll(() => requests.filter(url => url.includes('n1-audio-live-')).length).toBe(1)
  expect(requests.filter(url => url.includes('n1-audio-lesson-'))).toHaveLength(1)
  expect(requests.some(url => url.includes('n1-audio-archive-'))).toBe(false)
})

test('temporary audio metadata failures retry without reloading or changing progress', async ({ page }) => {
  let fail = true
  await page.route(/\/n1-audio-compound-au-[^/]+\.json$/, route => fail
    ? route.fulfill({ status: 503, body: 'Temporary failure' }) : route.continue())
  await page.goto('/#compound-verbs/au')
  await expect(page.getByText('音声情報を読み込めませんでした。教材はそのまま学習できます。', { exact: true })).toBeVisible()
  const before = await page.evaluate(() => localStorage.getItem('n1-progress'))
  fail = false
  await page.getByRole('button', { name: '音声情報を再読み込み', exact: true }).click()
  await expect(page.locator('.compound-word-card .audio-play-button').first()).toBeEnabled()
  await expect(page.getByRole('button', { name: '音声情報を再読み込み', exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('n1-progress'))).toBe(before)
})

test('live unit follows external browser history while the page remains mounted', async ({ page }) => {
  await page.goto('/?live-unit=2026-09-28#live-reactions')
  const unit = page.getByLabel('选择学习单元', { exact: true })
  await expect(unit).toHaveValue('2026-09-28')
  await page.evaluate(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('live-unit', '2026-09-30-okashi-bokuso')
    window.history.pushState(window.history.state, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(unit).toHaveValue('2026-09-30-okashi-bokuso')
  await page.goBack()
  await expect(unit).toHaveValue('2026-09-28')
  await expect(page.getByLabel('选择知识组', { exact: true })).toHaveValue('all')
})

for (const width of [1440, 390]) {
  test(`learning, review, reading and archive modules share the content edges at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`/?date=${archived.date}&section=vocabulary`)
    for (const [label, selectors] of [
      ['N1 語彙', ['.practice-section', '.learning-list']],
      ['N1 文法', ['.practice-section', '.grammar-list']],
      ['誤答復習', ['.empty-state', '.spaced-review']],
      ['没入読解', ['.reading-paper']],
      ['学習履歴', ['.history-summary', '.progress-backup', '.history-table-wrap', '.history-note']],
    ] as const) {
      if (width < 680) await page.getByRole('button', { name: 'ナビゲーションを開く', exact: true }).click()
      await nav(page).getByRole('button', { name: label, exact: true }).click()
      for (const selector of selectors) await expect(page.locator(selector)).toBeVisible()
      const bounds = await page.evaluate(targets => {
        const shell = document.querySelector('.content-shell')!
        const rect = shell.getBoundingClientRect(), style = getComputedStyle(shell)
        const left = rect.left + parseFloat(style.paddingLeft), right = rect.right - parseFloat(style.paddingRight)
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, edges: targets.map(selector => {
          const target = document.querySelector(selector)!.getBoundingClientRect()
          return { selector, left: Math.abs(target.left - left), right: Math.abs(target.right - right) }
        }) }
      }, [...selectors])
      expect(bounds.overflow).toBe(false)
      for (const edge of bounds.edges) { expect(edge.left, edge.selector).toBeLessThan(1); expect(edge.right, edge.selector).toBeLessThan(1) }
    }
    await page.screenshot({ path: testInfo.outputPath(`optimized-archive-${width}.png`) })
  })
}
