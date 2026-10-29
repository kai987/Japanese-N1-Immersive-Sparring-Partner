import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { audioId } from '../src/lib/audioText.ts'
import { liveUnits } from '../src/data/live-reaction-units.ts'

const pending = JSON.parse(readFileSync(new URL('../src/data/audio-pending.json', import.meta.url), 'utf8')) as {
  entries: { references: string[] }[]
}
const audioSources = JSON.parse(readFileSync(new URL('../src/data/audio-sources.json', import.meta.url), 'utf8')) as {
  clips: Record<string, unknown>
}

test('mobile learners can read pending audio status without hovering and published words stay playable', async ({ page }) => {
  const unit = liveUnits.find(unit => unit.id === '2026-10-29')!
  const count = pending.entries.filter(entry => entry.references.some(reference => reference.startsWith('live/' + unit.id + '/'))).length
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?live-unit=' + unit.id + '#live-reactions')
  if (count) {
    const summary = page.getByLabel('音声の準備状況', { exact: true }).filter({ hasText: '当前单元' })
    await expect(summary).toContainText('当前单元有 ' + count + ' 段音频待配音')
    await expect(summary).toContainText('既定后台时段')
    const group = unit.groups.find(group => group.entries.some(entry => !audioSources.clips[audioId(entry.reading || entry.expression)]))!
    const entry = group.entries.find(entry => !audioSources.clips[audioId(entry.reading || entry.expression)])!
    await page.getByLabel('选择知识组', { exact: true }).selectOption(group.id)
    const row = page.locator('.live-entry').filter({ has: page.getByText(entry.expression, { exact: true }) })
    await expect(row.getByText('待配音', { exact: true })).toBeVisible()
    await expect(row.getByRole('button', { name: entry.expression + 'の音声は準備中です', exact: true })).toBeDisabled()
  }
  await page.getByLabel('选择学习单元', { exact: true }).selectOption('2026-09-30-okashi-bokuso')
  await expect(page.locator('.live-entry .audio-play-button').first()).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
