import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { captureBuildSource, sealValidatedBuild, validatedBuildArtifact, verifyBuildProvenance, verifyValidatedBuild } from '../scripts/lib/validatedBuild.mjs'
import { restoreValidatedBuild } from '../scripts/validated-build.mjs'
import { createReleaseManifest, releaseManifestName } from '../scripts/lib/deploymentVerification.mjs'

const gates = ['Verify shared automation contract', 'Verify successful upstream Pages run and post-deployment check',
  'Rebuild and verify published study snapshot', 'Verify locked 09:00 N1 source blob', 'Materialize requested daily JSON and validated snapshot',
  'Verify study snapshot import', 'Capture candidate source tree', 'Validate content', 'Unit tests', 'Build', 'Install browser', 'Browser tests',
  'Commit verified content with fast-forward protection', 'Seal validated build for Pages', 'Retain validated Pages build']
const repository = 'test/n1', runId = 456, runAttempt = 2
const request = JSON.parse(readFileSync(new URL('../.github/n1-sync-request.json', import.meta.url), 'utf8'))
const trustedRun = (sourceCommit: string) => ({ id: runId, run_attempt: runAttempt, repository: { full_name: repository }, head_repository: { full_name: repository },
  path: '.github/workflows/sync-n1-daily.yml', head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success', head_sha: sourceCommit })
const trustedJobs = () => [{ name: 'sync', run_id: runId, status: 'completed', conclusion: 'success', steps: gates.map(name => ({ name, status: 'completed', conclusion: 'success' })) }]
const git = (root: string, ...args: string[]) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const write = (root: string, path: string, content: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content) }

async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'n1-validated-build-test-'))
  git(root, 'init', '-q'); git(root, 'config', 'user.name', 'Test'); git(root, 'config', 'user.email', 'test@example.invalid')
  write(root, '.gitignore', '/dist/\n/sealed/\n')
  write(root, '.github/n1-sync-request.json', JSON.stringify(request))
  write(root, 'src/data/it-study-snapshot.json', '{}')
  write(root, `src/data/daily/${request.targetDate}.json`, '{"before":true}')
  write(root, 'app.txt', 'unchanged source')
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'source request')
  const sourceCommit = git(root, 'rev-parse', 'HEAD')
  write(root, `src/data/daily/${request.targetDate}.json`, JSON.stringify(request.daily))
  const capture = captureBuildSource(root, request.targetDate)
  git(root, 'add', `src/data/daily/${request.targetDate}.json`); git(root, 'commit', '-qm', 'verified content')
  const commit = git(root, 'rev-parse', 'HEAD'), lessonPath = 'assets/lesson.json', searchPath = 'assets/search.json'
  const { date, day, title } = request.daily.lesson
  const files = { 'index.html': '<script src="./assets/index.js"></script>', 'assets/index.js': 'export const ready=true;',
    [lessonPath]: JSON.stringify({ lesson: { date, day, title }, reviewFocus: [] }),
    [searchPath]: JSON.stringify([{ lesson: { date, day, title }, chunks: [{ text: '教材', normalized: '教材', compact: '教材' }] }]) }
  const manifest = createReleaseManifest({ files: Object.entries(files).map(([path, content]) => ({ path, content })),
    lessons: { [date]: { path: lessonPath, day, title } }, latestDate: date, searchIndex: searchPath,
    studySnapshotCommit: request.sourceCommit, entryPoints: ['assets/index.js'] })
  for (const [path, content] of Object.entries(files)) write(root, `dist/${path}`, content)
  write(root, `dist/${releaseManifestName}`, JSON.stringify(manifest, null, 2) + '\n')
  write(root, 'dist/favicon.svg', '<svg/>') // Public files outside the release manifest are sealed too.
  const directory = join(root, 'sealed')
  const proof = await sealValidatedBuild({ root, capture, output: directory, repository, runId, runAttempt })
  const run = trustedRun(sourceCommit), jobs = trustedJobs()
  return { root, directory, capture, proof, run, jobs, commit, tree: git(root, 'rev-parse', 'HEAD^{tree}'), sourceCommit }
}

test('trusted same-tree content commit can reuse the exact validated dist and manifest', async () => {
  const f = await fixture()
  try {
    const proof = await verifyValidatedBuild({ ...f, repository, expectedCommit: f.commit })
    assert.equal(proof.commit, f.commit)
    assert.equal(proof.sourceCommit, f.sourceCommit)
    assert.equal(proof.tree, f.capture.tree)
    assert.ok(proof.files['favicon.svg'])
    assert.equal(validatedBuildArtifact(runAttempt), 'n1-validated-build-2')
    const expected = readFileSync(join(f.root, 'dist', releaseManifestName))
    rmSync(join(f.root, 'dist'), { recursive: true })
    const result = await restoreValidatedBuild({ root: f.root, runId: String(runId), repository, expectedCommit: f.commit,
      api: path => path.includes('/jobs?') ? { jobs: f.jobs } : f.run,
      download: (run, artifact, directory) => {
        assert.equal(run, String(runId)); assert.equal(artifact, validatedBuildArtifact(runAttempt))
        cpSync(f.directory, directory, { recursive: true })
      },
    })
    assert.equal(result.reused, true)
    assert.deepEqual(readFileSync(join(f.root, 'dist', releaseManifestName)), expected)
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})

test('an unchanged sync tree also remains reusable without creating a synthetic commit', () => {
  const sourceCommit = 'a'.repeat(40), tree = 'b'.repeat(40)
  for (const suffix of ['', '@main', '@refs/heads/main']) {
    const run = trustedRun(sourceCommit)
    run.path += suffix
    assert.doesNotThrow(() => verifyBuildProvenance({ repository, commit: sourceCommit, tree, parents: ['c'.repeat(40)], run, jobs: trustedJobs(),
      proof: { version: 1, repository, runId, runAttempt, sourceCommit, commit: sourceCommit, tree } }))
  }
})

test('forged origin, workflow, ref, run, attempt, commit, tree and lineage cannot enable reuse', () => {
  const sourceCommit = 'a'.repeat(40), commit = 'b'.repeat(40), tree = 'c'.repeat(40)
  const base = { repository, commit, tree, parents: [sourceCommit], run: trustedRun(sourceCommit), jobs: trustedJobs(),
    proof: { version: 1, repository, runId, runAttempt, sourceCommit, commit, tree } }
  const cases = [
    (value: typeof base) => { value.run.repository.full_name = 'fork/n1' },
    (value: typeof base) => { value.run.head_repository.full_name = 'fork/n1' },
    (value: typeof base) => { value.run.path = '.github/workflows/unrelated.yml' },
    (value: typeof base) => { value.run.path += '@refs/heads/untrusted' },
    (value: typeof base) => { value.run.head_branch = 'draft' },
    (value: typeof base) => { value.run.event = 'pull_request' },
    (value: typeof base) => { value.run.conclusion = 'failure' },
    (value: typeof base) => { value.run.status = 'in_progress' },
    (value: typeof base) => { value.run.head_sha = 'd'.repeat(40) },
    (value: typeof base) => { value.proof.runId++ },
    (value: typeof base) => { value.proof.runAttempt-- },
    (value: typeof base) => { value.proof.commit = 'e'.repeat(40) },
    (value: typeof base) => { value.proof.tree = 'f'.repeat(40) },
    (value: typeof base) => { value.parents = ['d'.repeat(40)] },
    (value: typeof base) => { value.parents.push('d'.repeat(40)) },
    (value: typeof base) => { value.jobs[0].run_id++ },
    (value: typeof base) => { value.jobs[0].conclusion = 'failure' },
  ]
  for (const change of cases) { const value = structuredClone(base); change(value); assert.throws(() => verifyBuildProvenance(value)) }
  for (const name of gates) {
    const value = structuredClone(base)
    value.jobs[0].steps.find(step => step.name === name)!.conclusion = 'skipped'
    assert.throws(() => verifyBuildProvenance(value), new RegExp(`Missing successful sync gate: ${name}`))
  }
})

test('source changes after validation, unexpected changed paths and mismatched target trees reject sealing', async () => {
  const f = await fixture()
  try {
    write(f.root, 'app.txt', 'changed after tests')
    assert.throws(() => captureBuildSource(f.root, request.targetDate), /outside the sync allowlist/)
    await assert.rejects(sealValidatedBuild({ root: f.root, capture: f.capture, output: join(f.root, 'bad'), repository, runId, runAttempt }), /Source changed after validation/)
    git(f.root, 'add', 'app.txt'); git(f.root, 'commit', '-qm', 'untested change')
    await assert.rejects(sealValidatedBuild({ root: f.root, capture: f.capture, output: join(f.root, 'bad'), repository, runId, runAttempt }), /Committed source differs/)
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})

test('untracked source is checked with exact filenames, while the target new daily file is permitted', async () => {
  const f = await fixture()
  try {
    for (const path of ['src/data/daily/2026-08-01.json', 'src/data/practice/other.json', 'public/unverified.svg',
      ` src/data/daily/${request.targetDate}.json`, `src/data/daily/${request.targetDate}.json\nextra`]) {
      write(f.root, path, 'untracked source')
      assert.throws(() => captureBuildSource(f.root, request.targetDate), /outside the sync allowlist/)
      await assert.rejects(sealValidatedBuild({ root: f.root, capture: f.capture, output: join(f.root, 'bad'), repository, runId, runAttempt }), /Source changed after validation/)
      rmSync(join(f.root, path))
    }
    const path = `src/data/daily/${request.targetDate}.json`, content = readFileSync(join(f.root, path), 'utf8')
    git(f.root, 'rm', path); git(f.root, 'commit', '-qm', 'request before first daily publication')
    write(f.root, path, content)
    const capture = captureBuildSource(f.root, request.targetDate)
    git(f.root, 'add', path); git(f.root, 'commit', '-qm', 'new verified daily')
    assert.equal(capture.tree, git(f.root, 'rev-parse', 'HEAD^{tree}'))
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})

test('all artifact bytes including public files and unexpected additions are verified before reuse', async () => {
  const f = await fixture()
  try {
    for (const path of ['assets/index.js', 'favicon.svg', 'extra.js', '__proto__', 'constructor']) {
      const copy = join(f.root, `tampered-${path.replaceAll('/', '-')}`)
      cpSync(f.directory, copy, { recursive: true })
      write(copy, `dist/${path}`, 'tampered')
      await assert.rejects(verifyValidatedBuild({ ...f, directory: copy, repository, expectedCommit: f.commit }), /inventory\/hash mismatch/)
    }
    const copy = join(f.root, 'missing')
    cpSync(f.directory, copy, { recursive: true })
    rmSync(join(copy, 'dist/assets/lesson.json'))
    await assert.rejects(verifyValidatedBuild({ ...f, directory: copy, repository, expectedCommit: f.commit }), /inventory\/hash mismatch/)
    const linked = join(f.root, 'symlink')
    cpSync(f.directory, linked, { recursive: true })
    symlinkSync(join(f.root, 'app.txt'), join(linked, 'dist/link.txt'))
    await assert.rejects(verifyValidatedBuild({ ...f, directory: linked, repository, expectedCommit: f.commit }), /regular files/)
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})

test('prototype-named build files are sealed as ordinary own entries and remain hash-verified', async () => {
  const f = await fixture()
  try {
    write(f.root, 'dist/__proto__', 'original public bytes')
    const directory = join(f.directory, 'prototype-file')
    const proof = await sealValidatedBuild({ root: f.root, capture: f.capture, output: directory, repository, runId, runAttempt })
    assert.equal(Object.hasOwn(proof.files, '__proto__'), true)
    assert.equal(Object.hasOwn(JSON.parse(readFileSync(join(directory, 'provenance.json'), 'utf8')).files, '__proto__'), true)
    await assert.doesNotReject(verifyValidatedBuild({ ...f, directory, repository, expectedCommit: f.commit }))
    write(directory, 'dist/__proto__', 'changed public bytes')
    await assert.rejects(verifyValidatedBuild({ ...f, directory, repository, expectedCommit: f.commit }), /inventory\/hash mismatch/)
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})

test('dispatch waits briefly for its exact sync run to finish; failed/expired/untrusted builds fall back', async () => {
  const f = await fixture()
  try {
    let clock = 0, calls = 0, downloads = 0
    const options = { root: f.root, runId: String(runId), repository, expectedCommit: f.commit, now: () => clock,
      wait: async (ms: number) => { clock += ms },
      download: (_run: string, _artifact: string, directory: string) => { downloads++; cpSync(f.directory, directory, { recursive: true }) },
    }
    const result = await restoreValidatedBuild({ ...options, api: path => path.includes('/jobs?') ? { jobs: f.jobs }
      : (++calls === 1 ? { ...f.run, status: 'in_progress', conclusion: null } : f.run) })
    assert.equal(result.reused, true); assert.equal(clock, 2_000); assert.equal(downloads, 1)
    downloads = 0; clock = 0
    assert.equal((await restoreValidatedBuild({ ...options, api: () => ({ ...f.run, status: 'in_progress', conclusion: null }) })).reused, false)
    assert.equal(clock, 30_000); assert.equal(downloads, 0)
    assert.equal((await restoreValidatedBuild({ ...options, api: () => ({ ...f.run, conclusion: 'failure' }) })).reused, false)
    assert.equal((await restoreValidatedBuild({ ...options, api: path => path.includes('/jobs?') ? { jobs: f.jobs } : { ...f.run, head_branch: 'fork' } })).reused, false)
    assert.equal(downloads, 0, 'untrusted runs must be rejected before artifact download')
    const expired = await restoreValidatedBuild({ ...options, api: path => path.includes('/jobs?') ? { jobs: f.jobs } : f.run,
      download: () => { throw new Error('Artifact expired') } })
    assert.equal(expired.reused, false)
    assert.ok(existsSync(join(f.root, 'dist/index.html')), 'fallback must not replace dist with unverified bytes')
    assert.equal((await restoreValidatedBuild({ ...options, runId: '', api: () => { throw new Error('No API request expected') } })).reused, false)
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})
