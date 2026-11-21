import test from 'node:test'
import assert from 'node:assert/strict'
import { appNavigationUrl, parseAppNavigation } from '../src/lib/appNavigation.ts'
import { practiceHref } from '../src/lib/questionReview.ts'
import { isExpiredResource, ResourceRequestError } from '../src/lib/resourceRecovery.ts'

const latest = '2026-11-20'
const dates = new Set(['2026-08-30', '2026-09-18', latest])
const resolveCompound = (hash: string) => hash.startsWith('#compound-verbs') ? 'komu' : undefined
const parse = (url: string) => parseAppNavigation(new URL(url, 'https://example.test/n1/'), dates, latest, resolveCompound)

test('ordinary dated sections round-trip through a reload URL without losing unrelated parameters', () => {
  for (const section of ['today', 'immersion', 'vocabulary', 'grammar', 'reading', 'review', 'history'] as const) {
    const state = { ...parse('/'), selectedDate: '2026-08-30', active: section }
    const url = appNavigationUrl(new URL('https://example.test/n1/?live-unit=2026-09-28&source=bookmark'), state)
    assert.equal(url.searchParams.get('live-unit'), '2026-09-28')
    assert.equal(url.searchParams.get('source'), 'bookmark')
    assert.deepEqual(parse(url.href), state)
  }
})

test('existing practice links take precedence over stale date/section query parameters', () => {
  const hash = practiceHref('2026-09-18', 'grammar', 'grammar-条件')
  const state = parse(`/?date=${latest}&section=history${hash}`)
  assert.equal(state.selectedDate, '2026-09-18')
  assert.equal(state.active, 'grammar')
  assert.equal(state.questionTarget?.questionId, 'grammar-条件')
  assert.equal(appNavigationUrl(new URL(`https://example.test/${hash}`), state).hash, hash)
})

test('unknown dates and malformed incoming practice links consistently show a link error', () => {
  for (const hash of ['#practice/2027-01-01/grammar/q1', '#practice/2026-08-30/unknown/q1', '#practice/%/reading/q1', '#practice/2026-08-30/reading/']) {
    const url = new URL(`https://example.test/?date=2026-08-30&section=review${hash}`)
    const initial = parse(url.href)
    assert.equal(initial.questionLinkError, true)
    assert.equal(initial.questionTarget, null)
    const retained = appNavigationUrl(url, initial)
    assert.equal(retained.hash, hash)
    assert.deepEqual(parse(retained.href), initial)
    const chosen = appNavigationUrl(retained, { ...initial, active: 'vocabulary', questionLinkError: false })
    assert.equal(chosen.hash, '')
  }
  for (const section of ['live-reactions', 'compound-verbs']) {
    const url = new URL(`https://example.test/?date=${latest}&section=${section}#practice/2027-01-01/reading/missing`)
    const state = parse(url.href)
    assert.equal(state.questionLinkError, true)
    assert.equal(appNavigationUrl(url, state).hash, url.hash)
    assert.equal(parse(appNavigationUrl(url, state).href).questionLinkError, true)
  }
})

test('unknown query dates/sections use safe defaults and live/compound hashes retain their formats', () => {
  assert.equal(parse('/?date=2099-01-01&section=invalid').selectedDate, latest)
  assert.equal(parse('/?date=2099-01-01&section=invalid').active, 'today')
  const live = parse('/?date=2026-08-30&live-unit=2026-09-28#live-reactions')
  assert.equal(live.active, 'live-reactions')
  assert.equal(live.selectedDate, '2026-08-30')
  assert.equal(appNavigationUrl(new URL('https://example.test/?live-unit=2026-09-28'), live).hash, '#live-reactions')
  const compound = parse('/#compound-verbs/komu')
  assert.equal(compound.compoundSeriesId, 'komu')
  assert.equal(appNavigationUrl(new URL('https://example.test/'), compound).hash, '#compound-verbs/komu')
})

test('only missing or retired resource responses request a version refresh', () => {
  for (const status of [404, 410]) assert.equal(isExpiredResource(new ResourceRequestError('Lesson', status)), true)
  for (const status of [403, 429, 500, 503]) assert.equal(isExpiredResource(new ResourceRequestError('Lesson', status)), false)
  assert.equal(isExpiredResource(new TypeError('Network failed')), false)
})

test('independent pages preserve canonical links and any explicitly carried lesson context', () => {
  for (const path of ['/?live-unit=2026-09-28#live-reactions', '/#compound-verbs/komu']) {
    const url = new URL(path, 'https://example.test/')
    assert.equal(appNavigationUrl(url, parse(url.href)).href, url.href)
    const dated = new URL(url.href)
    dated.searchParams.set('date', '2026-08-30')
    dated.searchParams.set('section', 'grammar')
    dated.searchParams.set('source', 'bookmark')
    const state = parse(dated.href)
    const retained = appNavigationUrl(dated, state)
    assert.equal(retained.searchParams.get('date'), '2026-08-30')
    assert.equal(retained.searchParams.has('section'), false)
    assert.equal(retained.searchParams.get('source'), 'bookmark')
    assert.deepEqual(parse(retained.href), state)
  }
})
