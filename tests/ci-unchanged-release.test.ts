import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { classifyReleaseChanges, isVerifiedActualPagesRun, parseChangedPaths, verifyUnchangedRelease } from '../scripts/ci-unchanged-release.mjs'

const checks = { requestDate: '2026-10-01', referenced: (path: string) => path === 'docs/used.md' || path === 'n1-source/2026-10-03.md',
  lessonExists: (date: string) => date === '2026-10-04' }
const change = (path: string, status = 'A') => ({ path, status })
test('only new unreferenced originals and ordinary documentation qualify for the unchanged release path', () => {
  assert.deepEqual(parseChangedPaths('A\0n1-source/2026-10-02.md\0M\0README.md\0'), [
    change('n1-source/2026-10-02.md'), change('README.md', 'M'),
  ])
  const eligible = classifyReleaseChanges([change('n1-source/2026-10-02.md'), change('README.md', 'M'), change('docs/ci.md')], checks)
  assert.equal(eligible.eligible, true)
  assert.deepEqual(eligible.dates, ['2026-10-02'])
  assert.throws(() => parseChangedPaths('A\0'), /Incomplete/)
  for (const item of [change('n1-source/2026-10-02.md', 'M'), change('n1-source/2026-10-02.md', 'D'),
    change('n1-source/revisions/2026-10-02-practice.md'), change('n1-source/2026-10-01.md'),
    change('n1-source/2026-10-03.md'), change('n1-source/2026-10-04.md'),
    change('docs/automation/README.md', 'M'), change('docs/used.md'), change('src/App.tsx', 'M'),
    change('src/data/live-reactions-2026-11-23.ts', 'M'), change('src/data/audio-pending.json', 'M'),
    change('.github/workflows/deploy-pages.yml', 'M'), change('public/new.png'), change('unknown.md')]) {
    assert.equal(classifyReleaseChanges([change('README.md', 'M'), item], checks).eligible, false, item.path)
  }
})
test('a previous failed or cancelled runtime deployment cannot be masked by a later documentation commit', () => {
  const lastPush = [change('README.md', 'M')]
  assert.equal(classifyReleaseChanges(lastPush, checks).eligible, true)
  const completeDiff = [change('src/components/LiveReactions.tsx', 'M'), ...lastPush]
  assert.equal(classifyReleaseChanges(completeDiff, checks).eligible, false)
})
test('only an actual successful same-repository Pages publication can serve as baseline', () => {
  const repo = 'test/n1'
  const run = { id: 1, run_attempt: 1, repository: { full_name: repo }, head_repository: { full_name: repo },
    head_branch: 'main', head_sha: 'a'.repeat(40), path: '.github/workflows/deploy-pages.yml',
    status: 'completed', conclusion: 'success' }
  const jobs = [{ name: 'build', run_id: 1, conclusion: 'success' }, {
    name: 'deploy', run_id: 1, conclusion: 'success', steps: [
      { name: 'Deploy to GitHub Pages', status: 'completed', conclusion: 'success' },
      { name: 'Verify live target date and exact release assets', status: 'completed', conclusion: 'success' },
    ],
  }]
  assert.equal(isVerifiedActualPagesRun(run, jobs, repo), true)
  assert.equal(isVerifiedActualPagesRun({ ...run, conclusion: 'failure' }, jobs, repo), false)
  assert.equal(isVerifiedActualPagesRun({ ...run, head_branch: 'fork' }, jobs, repo), false)
  assert.equal(isVerifiedActualPagesRun({ ...run, head_repository: { full_name: 'other/n1' } }, jobs, repo), false)
  for (const index of [0, 1]) {
    const bad = structuredClone(jobs)
    bad[1].steps![index].conclusion = 'skipped'
    assert.equal(isVerifiedActualPagesRun(run, bad, repo), false)
  }
})


test('the real unchanged release gate verifies a checkpoint and live bytes and falls back on pending runtime changes', async t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-ci-release-gate-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const write = (path: string, content: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content) }
  const commit = (message: string) => { git('add', '.'); git('commit', '-qm', message); return git('rev-parse', 'HEAD') }
  const request = JSON.parse(readFileSync(new URL('../.github/n1-sync-request.json', import.meta.url), 'utf8'))
  const repository = 'test/n1', date = '2026-10-02'
  assert.notEqual(request.targetDate, date)
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  write('.gitignore', '/dist/\n')
  write('.github/n1-sync-request.json', JSON.stringify(request))
  write('src/App.tsx', 'old runtime')
  write('README.md', 'old docs')
  const baseline = commit('actually published runtime')
  const run = { id: 123, run_attempt: 1, repository: { full_name: repository }, head_repository: { full_name: repository },
    head_branch: 'main', head_sha: baseline, path: '.github/workflows/deploy-pages.yml', status: 'completed', conclusion: 'success' }
  const jobs = [{ name: 'build', run_id: 123, conclusion: 'success' }, { name: 'deploy', run_id: 123, conclusion: 'success',
    steps: ['Deploy to GitHub Pages', 'Verify live target date and exact release assets'].map(name => ({ name, status: 'completed', conclusion: 'success' })) }]
  const markdown = '# 2026-10-02 Day 34\n学习\n错题\n'
  const record = { schemaVersion: 1, targetDate: date, day: 34, generatedAtJST: '2026-10-02T09:00:00+09:00',
    sha256: createHash('sha256').update(markdown).digest('hex'), bytes: Buffer.byteLength(markdown), markdown }
  write('n1-source/' + date + '.md', markdown)
  const candidate = commit('checkpointed original only')
  let downloaded = 0, verified = 0, validCheckpoint = true, validLive = true
  const options: Parameters<typeof verifyUnchangedRelease>[0] = {
    root, repository, expectedCommit: candidate, runId: '999', baseUrl: 'https://fixture.invalid/',
    api: path => path.includes('/contents/runs/')
      ? { encoding: 'base64', content: Buffer.from(JSON.stringify(validCheckpoint ? record : { ...record, bytes: 0 })).toString('base64') }
      : path.includes('/jobs?') ? { jobs } : { workflow_runs: [run] },
    download: (_run, name, directory) => {
      assert.equal(name, 'n1-deployment-verification'); downloaded++
      writeFileSync(join(directory, 'n1-release.json'), '{"fixture":true}')
    },
    verify: async ({ expectedManifest, target }) => {
      verified++; assert.equal(String(expectedManifest), '{"fixture":true}'); assert.equal(target?.date, request.targetDate)
      if (!validLive) throw new Error('live release mismatch')
      return { manifestSha256: 'a'.repeat(64), verifiedFiles: 1, latestDate: request.targetDate, targetDate: request.targetDate }
    },
  }
  const result = await verifyUnchangedRelease(options)
  assert.equal(result.unchanged, true)
  assert.equal(downloaded, 1); assert.equal(verified, 1)
  assert.equal(readFileSync(join(root, 'dist/n1-release.json'), 'utf8'), '{"fixture":true}')
  validCheckpoint = false
  assert.equal((await verifyUnchangedRelease(options)).unchanged, false)
  assert.equal(downloaded, 1, 'invalid original must not reach the live proof')
  validCheckpoint = true; validLive = false
  assert.equal((await verifyUnchangedRelease(options)).unchanged, false)
  validLive = true
  write('src/App.tsx', 'unpublished runtime change'); commit('failed deployment')
  write('README.md', 'documentation after failure')
  const later = commit('docs only tip')
  const blocked = await verifyUnchangedRelease({ ...options, expectedCommit: later })
  assert.equal(blocked.unchanged, false)
  if (!blocked.unchanged) assert.match(blocked.reason, /src\/App\.tsx/)
})
