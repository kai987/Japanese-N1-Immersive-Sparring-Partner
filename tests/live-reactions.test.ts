import test from 'node:test'
import assert from 'node:assert/strict'
import { liveReactionDate, liveReactionGroups } from '../src/data/live-reactions.ts'
import { decodeLiveProgress, liveProgressKey, matchesLiveGroup } from '../src/lib/liveReactions.ts'

test('live notes contain all 15 groups and 64 unique screenshot expressions', () => {
  assert.equal(liveReactionDate, '2026-09-28')
  assert.equal(liveReactionGroups.length, 15)
  assert.equal(new Set(liveReactionGroups.map(group => group.id)).size, 15)
  const entries = liveReactionGroups.flatMap(group => group.entries)
  assert.equal(entries.length, 64)
  assert.equal(new Set(entries.map(item => item.expression)).size, 64)
  for (const group of liveReactionGroups) {
    assert.ok(group.points.length && group.examples.length)
    for (const item of group.entries) assert.ok(item.expression.trim() && item.reading.trim() && item.meaning.trim())
  }
})

test('transcription and grammar corrections retain the original context', () => {
  const entries = liveReactionGroups.flatMap(group => group.entries)
  assert.ok(entries.some(item => item.expression === '思い切り殴る' && item.reading === 'おもいきりなぐる'))
  assert.ok(entries.find(item => item.expression === '捕まえるのを手伝う')?.note?.includes('捕まえるの手伝う'))
  assert.ok(liveReactionGroups.find(group => group.id.endsWith('-ki'))?.entries.find(item => item.expression === '気にする')?.note?.includes('并非一定'))
})

test('search matches Japanese, readings, Chinese and explanatory notes', () => {
  const group = liveReactionGroups[2]
  assert.equal(matchesLiveGroup(group, '思い切り'), true)
  assert.equal(matchesLiveGroup(group, 'おもいきりなぐる'), true)
  assert.equal(matchesLiveGroup(group, '果断'), true)
  assert.equal(matchesLiveGroup(group, '   '), true)
  assert.equal(matchesLiveGroup(group, '果断 不存在的内容'), false)
})

test('live progress uses its own key and safely recovers invalid data', () => {
  assert.notEqual(liveProgressKey, 'n1-progress')
  assert.equal(decodeLiveProgress(null).recovered, true)
  assert.equal(decodeLiveProgress({ version: 1, groups: [] }).recovered, true)
  assert.equal(decodeLiveProgress({ version: 2, groups: {} }).recovered, true)
  const decoded = decodeLiveProgress({ version: 1, groups: { known: 'mastered', other: 'review', bad: 123 } })
  assert.equal(decoded.recovered, true)
  assert.deepEqual(decoded.value.groups, { known: 'mastered', other: 'review' })
  assert.equal(decodeLiveProgress({ version: 1, groups: { known: 'new' } }).recovered, false)
})
