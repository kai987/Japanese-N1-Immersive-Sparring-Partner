import assert from 'node:assert/strict'
import test from 'node:test'
import { validateContent } from '../scripts/validate-content.ts'
import { createLessonSearchIndex, searchProject } from '../src/lib/projectSearch.ts'
import { searchCompoundSeries } from '../src/lib/compoundVerbs.ts'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { getSearchRanges } from '../src/lib/searchHighlight.ts'

const index = createLessonSearchIndex(validateContent().lessons, {})

test('project search gives lessons and compound series independent result budgets', () => {
  const groups = searchProject('間に合う', index)
  assert.ok(groups.find(group => group.kind === 'lesson')!.results.length > 0)
  assert.deepEqual(groups.find(group => group.kind === 'compound')!.results.map(result => result.kind === 'compound' && result.seriesId), ['au', 'time-quantity'])
  assert.ok(groups.every(group => group.results.length <= 4))
  const readings = searchProject('かんかつ', index).find(group => group.kind === 'lesson')!.results
  assert.ok(readings.some(result => result.kind === 'lesson' && result.section === 'vocabulary' && result.label.includes('管轄')))
})

test('global compound results use the same literal normalized matching as the series page', () => {
  for (const query of ['おりかえす', '回电', '折り返す おりかえす', 'ＡＰＩ', '折り返すおりかえす', '<script>']) {
    const results = searchProject(query, index).find(group => group.kind === 'compound')?.results ?? []
    assert.deepEqual(results.map(result => result.kind === 'compound' && result.seriesId), searchCompoundSeries(query).slice(0, 4).map(series => series.id))
  }
  for (const query of ['', '　 \t', '～ 〜']) assert.deepEqual(searchProject(query, index), [])
})

test('live results span units and source quotes and carry valid unit and group destinations', () => {
  for (const query of ['果断', 'つかいはたす', 'ふたたびチョコレート']) {
    const results = searchProject(query, index).find(group => group.kind === 'live')!.results
    assert.ok(results.length > 0)
    for (const result of results) {
      assert.equal(result.kind, 'live')
      if (result.kind !== 'live') continue
      assert.ok(liveUnits.find(unit => unit.id === result.unitId)?.groups.some(group => group.id === result.groupId))
      assert.ok(getSearchRanges(result.snippet, query).length > 0)
    }
  }
})
