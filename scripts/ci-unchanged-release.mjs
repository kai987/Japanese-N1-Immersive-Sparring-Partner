import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { verifyPublishedRelease, releaseArtifactName, releaseManifestName } from './lib/deploymentVerification.mjs'
import { dateInfo, validateRequest, verifySourceRecord } from './n1-automation.mjs'

const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const sourcePattern = /^n1-source\/(\d{4}-\d{2}-\d{2})\.md$/
const pagesPath = '.github/workflows/deploy-pages.yml'

export function parseChangedPaths(raw) {
  const fields = raw.split('\0')
  if (fields.pop() !== '' || fields.length % 2 !== 0) throw new Error('Incomplete Git change inventory')
  const entries = []
  for (let i = 0; i < fields.length; i += 2) {
    if (!fields[i] || !fields[i + 1]) throw new Error('Invalid Git change inventory')
    entries.push({ status: fields[i], path: fields[i + 1] })
  }
  return entries
}

const ordinaryDoc = path => path === 'README.md' || path === 'AGENTS.md' ||
  (/^docs\/(?!automation\/)[\w./-]+\.md$/.test(path) && !path.includes('..'))

// Fail closed on unknown paths/statuses. A changed or deleted original, any
// source already used by a lesson, policies, source code, CI and audio metadata
// always use the full release path. The check is applied to the COMPLETE diff
// from the last verified real publication, not just the latest push.
export function classifyReleaseChanges(changes, { requestDate, referenced, lessonExists }) {
  const dates = []
  if (!changes.length) return { eligible: false, reason: 'No candidate changes', dates }
  for (const { status, path } of changes) {
    if ((status === 'A' || status === 'M') && ordinaryDoc(path)) {
      if (path.startsWith('docs/') && referenced(path)) return { eligible: false, reason: 'Documentation is a build/test input', dates: [] }
      continue
    }
    const date = sourcePattern.exec(path)?.[1]
    if (status === 'A' && date && dateInfo(date).inPlan && date !== requestDate &&
        !lessonExists(date) && !referenced(path)) {
      dates.push(date); continue
    }
    return { eligible: false, reason: `Full verification required for ${status} ${path}`, dates: [] }
  }
  return { eligible: true, reason: 'Only ordinary docs and unreferenced new originals', dates }
}

const successfulStep = (job, name) => job?.steps?.some(step => step.name === name && step.status === 'completed' && step.conclusion === 'success')
export function isVerifiedActualPagesRun(run, jobs, repository) {
  if (!run || run.repository?.full_name !== repository || run.head_repository?.full_name !== repository ||
      run.head_branch !== 'main' || ![pagesPath, pagesPath + '@main', pagesPath + '@refs/heads/main'].includes(run.path) ||
      run.status !== 'completed' || run.conclusion !== 'success' || !sha(run.head_sha) ||
      !Number.isSafeInteger(run.id) || run.id < 1 || !Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1) return false
  const build = jobs.find(job => job.name === 'build' && job.run_id === run.id && job.conclusion === 'success')
  const deploy = jobs.find(job => job.name === 'deploy' && job.run_id === run.id && job.conclusion === 'success')
  return Boolean(build && deploy && successfulStep(deploy, 'Deploy to GitHub Pages') &&
    successfulStep(deploy, 'Verify live target date and exact release assets'))
}

const git = (root, args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024 })
const diff = (root, from, to) => parseChangedPaths(git(root, ['diff', '--name-status', '-z', '--no-renames', from, to]))
const ancestor = (root, from, to) => { try { git(root, ['merge-base', '--is-ancestor', from, to]); return true } catch { return false } }

export async function verifyUnchangedRelease({ root, repository, expectedCommit, runId, baseUrl, api, download, verify = verifyPublishedRelease }) {
  try {
    if (!sha(expectedCommit) || git(root, ['rev-parse', 'HEAD']).trim() !== expectedCommit) throw new Error('Current checkout differs from requested release')
    const request = validateRequest(JSON.parse(readFileSync(join(root, '.github/n1-sync-request.json'), 'utf8')))
    const checks = {
      requestDate: request.targetDate,
      lessonExists: date => ['daily', 'practice'].some(dir => existsSync(join(root, 'src/data', dir, date + '.json'))),
      referenced: path => {
        try {
          git(root, ['grep', '-F', '-l', '-e', path, 'HEAD', '--', 'src', 'scripts', 'tests', '.github'])
          return true
        } catch (error) {
          if (error?.status === 1) return false
          throw error
        }
      },
    }
    // Cheap first gate: ordinary application changes need no API/history reads.
    const tip = classifyReleaseChanges(diff(root, 'HEAD^', 'HEAD'), checks)
    if (!tip.eligible) return { unchanged: false, reason: tip.reason }
    const list = await api(`repos/${repository}/actions/workflows/deploy-pages.yml/runs?branch=main&status=success&per_page=25`)
    let baseline
    for (const run of list.workflow_runs ?? []) {
      if (String(run.id) === String(runId) || !sha(run.head_sha)) continue
      const result = await api(`repos/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`)
      if (isVerifiedActualPagesRun(run, result.jobs ?? [], repository)) { baseline = run; break }
    }
    if (!baseline) return { unchanged: false, reason: 'No recent real verified Pages deployment' }
    if (!ancestor(root, baseline.head_sha, expectedCommit)) {
      // Shallow Pages checkouts usually contain the baseline. Bounded deepen
      // only on an otherwise eligible push; failure falls back to full CI.
      git(root, ['fetch', '--no-tags', '--deepen=40', 'origin', 'main'])
    }
    if (!ancestor(root, baseline.head_sha, expectedCommit)) return { unchanged: false, reason: 'Cannot prove published baseline ancestry' }
    const changes = classifyReleaseChanges(diff(root, baseline.head_sha, expectedCommit), checks)
    if (!changes.eligible) return { unchanged: false, reason: changes.reason }
    for (const date of changes.dates) {
      const file = await api(`repos/${repository}/contents/runs/${date}/source.json?ref=automation/n1-progress`)
      if (file.encoding !== 'base64' || typeof file.content !== 'string') throw new Error('Original checkpoint content unavailable')
      const record = verifySourceRecord(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')))
      const original = join(root, 'n1-source', date + '.md')
      if (record.targetDate !== date || !lstatSync(original).isFile() || !readFileSync(original).equals(Buffer.from(record.markdown, 'utf8'))) {
        throw new Error('Original is not byte-identical to its verified checkpoint')
      }
    }
    const temporary = mkdtempSync(join(tmpdir(), 'n1-unchanged-release-'))
    try {
      await download(String(baseline.id), releaseArtifactName, temporary)
      const manifest = readFileSync(join(temporary, releaseManifestName))
      await verify({ baseUrl, expectedManifest: manifest, target: {
        date: request.targetDate, day: request.daily.lesson.day, title: request.daily.lesson.title,
        sourceCommit: request.sourceCommit,
      }, timeoutMs: 45_000 })
      mkdirSync(join(root, 'dist'), { recursive: true })
      writeFileSync(join(root, 'dist', releaseManifestName), manifest)
      return { unchanged: true, baselineRun: baseline.id, baselineCommit: baseline.head_sha, originalDates: changes.dates }
    } finally { rmSync(temporary, { recursive: true, force: true }) }
  } catch (error) {
    return { unchanged: false, reason: error instanceof Error ? error.message : 'Unchanged release proof unavailable' }
  }
}

export async function main(env = process.env) {
  const result = env.GITHUB_EVENT_NAME === 'push'
    ? await verifyUnchangedRelease({
      root: resolve('.'), repository: env.GITHUB_REPOSITORY, expectedCommit: env.GITHUB_SHA, runId: env.GITHUB_RUN_ID, baseUrl: env.PAGE_URL,
      api: path => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', timeout: 10_000, maxBuffer: 8 * 1024 * 1024 })),
      download: (run, name, directory) => execFileSync('gh', ['run', 'download', run, '--repo', env.GITHUB_REPOSITORY, '--name', name, '--dir', directory], { stdio: 'inherit', timeout: 40_000 }),
    }) : { unchanged: false, reason: 'Manual/recovery runs must use normal validation' }
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `unchanged=${result.unchanged}\n`)
  const summary = result.unchanged
    ? `Verified unchanged release from actual published run ${result.baselineRun}, commit ${result.baselineCommit}. New originals checked against their checkpoint: ${result.originalDates.join(', ') || 'none'}. No new Pages upload or browser rebuild is required; exact live verification still runs.\n`
    : `Normal release validation required: ${String(result.reason).replace(/[\r\n]/g, ' ')}\n`
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, summary)
  console.log(JSON.stringify(result))
  return result
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main()
