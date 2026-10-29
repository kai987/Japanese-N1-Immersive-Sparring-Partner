import { createHash } from 'node:crypto'

export const releaseManifestName = 'n1-release.json'
export const releaseArtifactName = 'n1-deployment-verification'
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const bytesOf = value => typeof value === 'string' ? Buffer.from(value) : Buffer.from(value)
const validPath = path => typeof path === 'string' && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(path)
  && !path.split('/').some(part => !part || part === '.' || part === '..')
const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
const record = value => value && typeof value === 'object' && !Array.isArray(value)
const comparePath = (a, b) => a < b ? -1 : a > b ? 1 : 0

export function createReleaseManifest({ files, lessons, latestDate, searchIndex, studySnapshotCommit, entryPoints }) {
  const manifest = {
    version: 1, latestDate, studySnapshotCommit, entryPoints: [...entryPoints].sort(),
    lessons: Object.fromEntries(Object.entries(lessons).sort(([a], [b]) => comparePath(a, b))), searchIndex,
    files: Object.fromEntries(files.map(file => [file.path, { sha256: digest(bytesOf(file.content)), bytes: bytesOf(file.content).length }])
      .sort(([a], [b]) => comparePath(a, b))),
  }
  validateManifest(manifest)
  return manifest
}

function validateManifest(manifest) {
  if (!record(manifest) || manifest.version !== 1 || !validDate(manifest.latestDate)
    || !/^[a-f0-9]{40}$/.test(manifest.studySnapshotCommit ?? '') || !record(manifest.files) || !record(manifest.lessons)) throw new Error('Invalid N1 release manifest')
  const files = Object.entries(manifest.files)
  if (!files.length || files.length > 512 || !manifest.files['index.html']) throw new Error('Release manifest is missing the application document')
  for (const [path, file] of files) {
    if (!validPath(path) || path === releaseManifestName || !record(file) || !/^[a-f0-9]{64}$/.test(file.sha256 ?? '')
      || !Number.isSafeInteger(file.bytes) || file.bytes < 1 || file.bytes > 32 * 1024 * 1024) throw new Error(`Invalid release file: ${path}`)
  }
  if (!Array.isArray(manifest.entryPoints) || !manifest.entryPoints.length
    || manifest.entryPoints.some(path => !manifest.files[path] || !path.endsWith('.js'))) throw new Error('Release manifest is missing the application entry script')
  const lessons = Object.entries(manifest.lessons)
  if (!lessons.length || !manifest.lessons[manifest.latestDate] || !manifest.files[manifest.searchIndex]
    || !manifest.searchIndex.endsWith('.json')) throw new Error('Release manifest is missing verified learning data')
  for (const [date, lesson] of lessons) {
    if (!validDate(date) || !record(lesson) || !manifest.files[lesson.path] || !lesson.path.endsWith('.json')
      || !Number.isInteger(lesson.day) || lesson.day < 1 || typeof lesson.title !== 'string' || !lesson.title.trim()) throw new Error(`Invalid release lesson: ${date}`)
  }
  return manifest
}

/** Verify public bytes against the manifest retained by the exact build run. */
export async function verifyPublishedRelease({ baseUrl, expectedManifest, target, fetchImpl = fetch,
  signal, timeoutMs = 120_000, requestTimeoutMs = 30_000, concurrency = 4 }) {
  if (!expectedManifest) throw new Error('An exact-build release manifest is required')
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error('Invalid verification concurrency')
  const expectedBytes = bytesOf(expectedManifest)
  const manifest = validateManifest(JSON.parse(expectedBytes.toString('utf8')))
  if (target) {
    const lesson = manifest.lessons[target.date]
    if (!lesson || (target.day !== undefined && lesson.day !== target.day) || (target.title !== undefined && lesson.title !== target.title)) throw new Error('Release manifest does not match the requested lesson')
    if (target.sourceCommit !== undefined && manifest.studySnapshotCommit !== target.sourceCommit) throw new Error('Release study snapshot does not match the pinned upstream source')
  }
  const base = new URL(baseUrl)
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Invalid publication URL')
  if (!base.pathname.endsWith('/')) base.pathname += '/'
  base.search = ''; base.hash = ''
  const controller = new AbortController()
  const overall = AbortSignal.any([controller.signal, AbortSignal.timeout(timeoutMs), ...(signal ? [signal] : [])])
  const get = async path => {
    const url = new URL(path, base)
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) throw new Error(`Release URL escapes the site: ${path}`)
    const response = await fetchImpl(url, { cache: 'no-store', signal: AbortSignal.any([overall, AbortSignal.timeout(requestTimeoutMs)]) })
    if (!response.ok) throw new Error(`Published asset HTTP ${response.status}: ${path}`)
    return Buffer.from(await response.arrayBuffer())
  }
  try {
    const published = await get(releaseManifestName)
    if (digest(published) !== digest(expectedBytes) || !published.equals(expectedBytes)) throw new Error('Published release manifest differs from the exact build')
    const data = new Map(), files = Object.entries(manifest.files)
    const lessonPaths = new Set(Object.values(manifest.lessons).map(lesson => lesson.path))
    let cursor = 0
    const worker = async () => {
      while (cursor < files.length) {
        const [path, expected] = files[cursor++]
        const body = await get(path)
        if (body.length !== expected.bytes || digest(body) !== expected.sha256) throw new Error(`Published asset hash/size mismatch: ${path}`)
        if (path === manifest.searchIndex || lessonPaths.has(path)) {
          try { data.set(path, JSON.parse(body.toString('utf8'))) }
          catch { throw new Error(`Published learning data is not JSON: ${path}`) }
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker))
    const search = data.get(manifest.searchIndex)
    if (!Array.isArray(search)) throw new Error('Published search index is invalid')
    const indexed = new Map()
    for (const row of search) {
      if (!record(row) || !record(row.lesson) || !validDate(row.lesson.date) || indexed.has(row.lesson.date) || !Array.isArray(row.chunks)
        || row.chunks.some(chunk => !record(chunk) || typeof chunk.text !== 'string' || typeof chunk.normalized !== 'string' || typeof chunk.compact !== 'string')) throw new Error('Published search records are invalid')
      indexed.set(row.lesson.date, row.lesson)
    }
    if (indexed.size !== Object.keys(manifest.lessons).length) throw new Error('Published search history is incomplete')
    for (const [date, expected] of Object.entries(manifest.lessons)) {
      const payload = data.get(expected.path), row = indexed.get(date)
      if (!record(payload) || !record(payload.lesson) || !Array.isArray(payload.reviewFocus) || payload.lesson.date !== date
        || payload.lesson.day !== expected.day || payload.lesson.title !== expected.title) throw new Error(`Published lesson contents do not match: ${date}`)
      if (!row || row.day !== expected.day || row.title !== expected.title) throw new Error(`Published search lesson does not match: ${date}`)
    }
    return { manifestSha256: digest(expectedBytes), verifiedFiles: files.length, latestDate: manifest.latestDate, targetDate: target?.date ?? null }
  } catch (error) {
    controller.abort(error)
    throw error
  }
}
