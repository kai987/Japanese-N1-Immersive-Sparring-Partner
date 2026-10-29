import test from 'node:test'
import assert from 'node:assert/strict'
import { createReleaseManifest, releaseManifestName, verifyPublishedRelease } from '../scripts/lib/deploymentVerification.mjs'

const baseUrl = 'https://example.test/N1/'
const sourceCommit = 'a'.repeat(40)
const lessonPath = 'assets/n1-lesson-2026-09-18-fixture.json'
const latestPath = 'assets/n1-lesson-2026-10-29-fixture.json'
const searchPath = 'assets/n1-search-index-fixture.json'
const target = { date: '2026-09-18', day: 20, title: '保存済みの教材', sourceCommit }
export function deploymentFixture(change?: (files: Record<string, string>) => void) {
  const metadata = { [target.date]: { path: lessonPath, day: target.day, title: target.title },
    '2026-10-29': { path: latestPath, day: 61, title: '最新の教材' } }
  const files: Record<string, string> = {
    'index.html': '<html><script type="module" src="./assets/index-fixture.js"></script></html>',
    'assets/index-fixture.js': 'export const latest="2026-10-29";',
    'assets/index-fixture.css': 'body{color:#222}',
    [searchPath]: JSON.stringify(Object.entries(metadata).map(([date, lesson]) => ({ lesson: { date, day: lesson.day, title: lesson.title }, chunks: [{ text: '教材', normalized: '教材', compact: '教材' }] }))),
  }
  for (const [date, lesson] of Object.entries(metadata)) files[lesson.path] = JSON.stringify({ lesson: { date, day: lesson.day, title: lesson.title }, reviewFocus: [] })
  change?.(files)
  const manifest = createReleaseManifest({ files: Object.entries(files).map(([path, content]) => ({ path, content })), lessons: metadata,
    latestDate: '2026-10-29', searchIndex: searchPath, studySnapshotCommit: sourceCommit, entryPoints: ['assets/index-fixture.js'] })
  const expectedManifest = JSON.stringify(manifest, null, 2) + '\n'
  const publishedFiles: Record<string, string> = { ...files, [releaseManifestName]: expectedManifest }
  return { manifest, expectedManifest, files: publishedFiles }
}
function scriptedFetch(fixture: ReturnType<typeof deploymentFixture>, override?: (path: string) => Response | undefined) {
  const requested: string[] = []
  const fetchImpl: typeof fetch = async input => {
    const url = new URL(String(input))
    assert.equal(url.origin, 'https://example.test')
    assert.ok(url.pathname.startsWith('/N1/'), 'relative Pages base must be retained')
    const path = url.pathname.slice('/N1/'.length)
    requested.push(path)
    return override?.(path) ?? new Response(fixture.files[path] ?? 'Missing', { status: path in fixture.files ? 200 : 404 })
  }
  return { fetchImpl, requested }
}

test('an exact build proves the document, main script, styles, every lesson and parsed search index at a Pages subpath', async () => {
  const fixture = deploymentFixture(), { fetchImpl, requested } = scriptedFetch(fixture)
  const result = await verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target, fetchImpl })
  assert.equal(result.targetDate, target.date)
  assert.equal(result.latestDate, '2026-10-29')
  assert.equal(result.verifiedFiles, 6)
  assert.deepEqual(new Set(requested), new Set(Object.keys(fixture.files)))
  assert.deepEqual(createReleaseManifest({ files: Object.entries(fixture.files).filter(([path]) => path !== releaseManifestName).reverse().map(([path, content]) => ({ path, content })),
    lessons: fixture.manifest.lessons, latestDate: fixture.manifest.latestDate, searchIndex: searchPath, studySnapshotCommit: sourceCommit,
    entryPoints: fixture.manifest.entryPoints }), fixture.manifest, 'a repeated same-input build retains the complete exact release proof')
})

for (const status of [403, 404]) for (const path of [releaseManifestName, lessonPath, searchPath]) {
  test(`publication fails on HTTP ${status} for ${path}`, async () => {
    const fixture = deploymentFixture(), { fetchImpl } = scriptedFetch(fixture, requested => requested === path ? new Response('Unavailable', { status }) : undefined)
    await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target, fetchImpl }), new RegExp(`HTTP ${status}`))
  })
}
for (const path of ['index.html', 'assets/index-fixture.js', lessonPath, searchPath]) {
  test(`publication rejects wrong bytes even when ${path} returns HTTP 200`, async () => {
    const fixture = deploymentFixture(), { fetchImpl } = scriptedFetch(fixture, requested => requested === path ? new Response('Wrong bytes') : undefined)
    await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target, fetchImpl }), /hash\/size mismatch/)
  })
}
test('remote self-consistency cannot replace the manifest from the exact workflow run', async () => {
  const fixture = deploymentFixture(), other = deploymentFixture(files => { files['assets/index-fixture.js'] += '// another release' })
  const { fetchImpl } = scriptedFetch(other)
  await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target, fetchImpl }), /manifest differs from the exact build/)
})
test('the actual archived JSON must match its requested date, Day and title', async () => {
  const fixture = deploymentFixture(files => { files[lessonPath] = JSON.stringify({ lesson: { date: '2026-09-19', day: target.day, title: target.title }, reviewFocus: [] }) })
  await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target, ...scriptedFetch(fixture) }), /lesson contents do not match/)
})
test('target and pinned upstream source must match before a release can be accepted', async () => {
  const fixture = deploymentFixture(), { fetchImpl } = scriptedFetch(fixture)
  await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target: { ...target, title: '別の教材' }, fetchImpl }), /requested lesson/)
  await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target: { ...target, sourceCommit: 'b'.repeat(40) }, fetchImpl }), /pinned upstream source/)
})
for (const invalid of ['not JSON', '{}', '[]']) {
  test(`the search index must parse and cover every published lesson (${invalid})`, async () => {
    const fixture = deploymentFixture(files => { files[searchPath] = invalid })
    await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, target, ...scriptedFetch(fixture) }), /not JSON|search index is invalid|search history is incomplete/)
  })
}
test('concurrent requests stay bounded and stalled requests honor the verification deadline', async () => {
  const fixture = deploymentFixture()
  let active = 0, peak = 0
  const fetchImpl: typeof fetch = async input => {
    active++; peak = Math.max(peak, active)
    await new Promise(resolve => setTimeout(resolve, 1))
    active--
    return new Response(fixture.files[new URL(String(input)).pathname.slice('/N1/'.length)])
  }
  await verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, fetchImpl, concurrency: 2 })
  assert.ok(peak <= 2)
  const stalled: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    const abort = init?.signal
    if (abort?.aborted) reject(abort.reason)
    else abort?.addEventListener('abort', () => reject(abort.reason), { once: true })
  })
  // Keep this test's event loop alive while AbortSignal's unref'ed timer fires.
  const timer = setTimeout(() => {}, 1000)
  try { await assert.rejects(verifyPublishedRelease({ baseUrl, expectedManifest: fixture.expectedManifest, fetchImpl: stalled, timeoutMs: 20, requestTimeoutMs: 10 }), /timeout|aborted/i) }
  finally { clearTimeout(timer) }
})
