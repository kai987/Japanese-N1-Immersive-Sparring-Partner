import { test, expect, type Page } from '@playwright/test'
import { audioPlaybackUrl } from '../src/lib/audioSources'
import { readFileSync } from 'node:fs'
import { validateContent } from '../scripts/validate-content'

// New daily text can be published before its local speech generation finishes.
// Exercise a recorded lesson instead of assuming today's lesson has audio.
const recordedDates = new Set<string>(JSON.parse(readFileSync(new URL('../public/audio/manifest.json', import.meta.url), 'utf8')).lessonDates)
const lessons = validateContent().lessons
const recordedLesson = lessons.find(lesson => recordedDates.has(lesson.date))!
async function openRecordedLesson(page: Page, lesson = recordedLesson) {
  await page.goto('/')
  await page.locator('.date-dropdown-trigger').click()
  await page.getByRole('option', { name: new RegExp(`^Day ${lesson.day}\\b`) }).click()
}

// Browser plugin not available. Verify real MP3 responses and actual media
// playback in the configured browser; do not mock HTMLMediaElement.play().
const vocabulary = (page: Page) => page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: 'N1 語彙', exact: true })
const player = (page: Page) => page.locator('audio[data-study-audio]')
const firstWord = (page: Page) => page.locator('.learning-card .vocabulary-heading .audio-play-button').first()
const firstExample = (page: Page) => page.locator('.learning-card .example-box .audio-play-button').first()
async function playing(page: Page) {
  await expect(player(page)).toHaveCount(1)
  await expect.poll(() => player(page).evaluate(element => {
    const audio = element as HTMLAudioElement
    return !audio.paused && audio.readyState >= 2 && audio.currentTime > .04
  })).toBe(true)
}

test('word and sentence buttons play real morioki audio, pause/resume, and keep a single active recording', async ({ page }, testInfo) => {
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => requests.push(request.url()))
  await openRecordedLesson(page)
  await vocabulary(page).click()
  await expect(firstWord(page)).toBeEnabled()
  expect(requests.filter(url => url.endsWith('.mp3'))).toHaveLength(0)
  await firstExample(page).click()
  await playing(page)
  await expect(firstExample(page)).toHaveAttribute('aria-pressed', 'true')
  const sentenceSource = await player(page).getAttribute('src')
  const pauseTime = await player(page).evaluate(element => (element as HTMLAudioElement).currentTime)
  await firstExample(page).click()
  await expect(firstExample(page)).toHaveClass(/paused/)
  await expect.poll(() => player(page).evaluate(element => (element as HTMLAudioElement).paused)).toBe(true)
  await firstExample(page).click()
  await playing(page)
  await expect.poll(() => player(page).evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(pauseTime)
  await firstWord(page).click()
  await playing(page)
  await expect(player(page)).not.toHaveAttribute('src', sentenceSource!)
  await expect(firstExample(page)).toHaveAttribute('aria-pressed', 'false')
  await expect(firstWord(page)).toHaveAttribute('aria-pressed', 'true')
  expect(requests.some(url => url.includes(':10101') || url.includes(':10102'))).toBe(false)
  await page.screenshot({ path: testInfo.outputPath('audio-vocabulary-desktop.png') })
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: 'N1 文法', exact: true }).click()
  await expect.poll(() => player(page).evaluate(element => (element as HTMLAudioElement).paused)).toBe(true)
  await expect(player(page)).not.toHaveAttribute('src')
  expect(errors).toEqual([])
})

test('an audio load failure offers retry and successfully reloads the same recording', async ({ page }) => {
  await openRecordedLesson(page)
  await vocabulary(page).click()
  const id = await firstWord(page).getAttribute('data-audio-id')
  const pattern = audioPlaybackUrl(id!)
  await page.route(pattern, route => route.fulfill({ status: 503, body: 'Temporary audio failure' }))
  await firstWord(page).click()
  await expect(firstWord(page)).toHaveClass(/error/)
  await expect(page.locator('.audio-play-error')).toContainText('再試行')
  await page.unroute(pattern)
  await firstWord(page).click()
  await playing(page)
  await expect(page.locator('.audio-play-error')).toHaveCount(0)
})

test('unique compound audio plays from Supabase while shared daily vocabulary uses R2', async ({ page }) => {
  await openRecordedLesson(page)
  await vocabulary(page).click()
  await expect(firstWord(page)).toHaveAttribute('data-audio-provider', 'daily')
  await firstWord(page).click()
  await playing(page)
  await expect(player(page)).toHaveAttribute('src', /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//)
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: '複合動詞', exact: true }).click()
  await page.locator('.compound-word-card .audio-play-button[data-audio-provider="supabase"]').first().click()
  await playing(page)
  await expect(player(page)).toHaveAttribute('src', /^https:\/\/flpmblfscgcbrprwwckz\.supabase\.co\/storage\/v1\/object\/public\/n1-audio\//)
})

test('reading choices can be heard without selecting or submitting an answer', async ({ page }) => {
  await openRecordedLesson(page)
  await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: '読解練習', exact: true }).click()
  await expect(page.locator('.quiz-paper .spoken-sentence.has-audio').first()).toBeVisible()
  await page.locator('.answer-choice-audio .audio-play-button').first().click()
  await playing(page)
  await expect(page.locator('.answer-option[aria-pressed="true"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '回答する', exact: true })).toBeDisabled()
  await expect(page.locator('.result-panel')).toHaveCount(0)
})

test('audio controls fit 390px and 320px dark vocabulary, compound and live cards', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('n1-theme', JSON.stringify('dark')))
  await page.setViewportSize({ width: 390, height: 844 })
  await openRecordedLesson(page)
  await page.getByRole('button', { name: 'ナビゲーションを開く', exact: true }).click()
  await vocabulary(page).click()
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await expect(firstWord(page)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`audio-vocabulary-mobile-dark-${width}.png`) })
  }
  for (const name of ['複合動詞', '直播条反']) {
    await page.getByRole('button', { name: 'ナビゲーションを開く', exact: true }).click()
    await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name, exact: true }).click()
    const cards = page.locator(name === '複合動詞' ? '.compound-word-card' : '.live-group-card')
    await expect(cards.first().locator('.audio-play-button').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})


test('changing live note filters stops audio from the previous visible group', async ({ page }) => {
  // Pin a recorded archive; the newest study notes may legitimately await audio.
  await page.goto('/?live-unit=2026-09-30-okashi-bokuso#live-reactions')
  await page.locator('.live-examples .audio-play-button').first().click()
  await playing(page)
  await page.getByRole('group', { name: '内容分类', exact: true }).getByRole('button', { name: /漫画双关/ }).click()
  await expect.poll(() => player(page).evaluate(element => (element as HTMLAudioElement).paused)).toBe(true)
  await expect(player(page)).not.toHaveAttribute('src')
})

// A repair must exercise each newly completed lesson, not only older shared audio.
const requestedDates = process.env.N1_AUDIO_VERIFY_DATES?.split(',')
const recentLessons = requestedDates ? requestedDates.map(date => {
  const lesson = lessons.find(lesson => lesson.date === date)
  if (!lesson || !recordedDates.has(date)) throw new Error(`Requested audio lesson is incomplete: ${date}`)
  return lesson
}) : lessons.filter(lesson => recordedDates.has(lesson.date)).slice(0, 2)
for (const lesson of recentLessons) {
  test(`completed Day ${lesson.day} (${lesson.date}) immersion recording really plays`, async ({ page }) => {
    await openRecordedLesson(page, lesson)
    await page.getByRole('navigation', { name: 'メインナビゲーション', exact: true }).getByRole('button', { name: '没入読解', exact: true }).click()
    const button = page.locator('#immersion-title .audio-play-button')
    await expect(button).toBeEnabled()
    await button.click()
    await playing(page)
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => player(page).evaluate(element => (element as HTMLAudioElement).error?.code ?? null)).toBe(null)
  })
}
