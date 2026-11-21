import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verifySyncChangedPaths } from '../verify-sync-changed-paths.mjs'
import { verifyPublishedRelease, releaseManifestName } from './deploymentVerification.mjs'
import { validateRequest } from '../n1-automation.mjs'

export const validatedBuildArtifact = attempt => `n1-validated-build-${attempt}`
const workflowPath = '.github/workflows/sync-n1-daily.yml'
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const requireValid = (ok, message) => { if (!ok) throw new Error(message) }
const git = (root, args, env = {}) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', env: { ...process.env, ...env } }).trim()
const changedPaths = root => [
  ...execFileSync('git', ['-C', root, 'diff', '--name-only', '-z', 'HEAD'], { encoding: 'utf8' }).split('\0'),
  ...execFileSync('git', ['-C', root, 'ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0'),
].filter(Boolean)

/** Capture the exact candidate source tree before any validation/build/test gate. */
export function captureBuildSource(root, date) {
  const allowed = [`src/data/daily/${date}.json`, 'src/data/it-study-snapshot.json']
  verifySyncChangedPaths(date, allowed.join('\n'))
  const changed = changedPaths(root)
  requireValid(changed.every(path => allowed.includes(path)), 'Candidate includes changes outside the sync allowlist')
  const directory = mkdtempSync(join(tmpdir(), 'n1-source-tree-'))
  try {
    const env = { GIT_INDEX_FILE: join(directory, 'index') }
    git(root, ['read-tree', 'HEAD'], env)
    git(root, ['add', '--', ...allowed], env)
    return { sourceCommit: git(root, ['rev-parse', 'HEAD']), tree: git(root, ['write-tree'], env) }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

function inventory(root, directory = root) {
  // File names are data: prototype names must be ordinary own keys too.
  const result = Object.create(null)
  requireValid(lstatSync(directory).isDirectory() && !lstatSync(directory).isSymbolicLink(), 'Build directory must not be a symlink')
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) Object.assign(result, inventory(root, path))
    else {
      requireValid(entry.isFile(), 'Build may contain only regular files and directories')
      const bytes = readFileSync(path)
      result[path.slice(root.length + 1).replaceAll('\\', '/')] = { bytes: bytes.length, sha256: digest(bytes) }
    }
  }
  return result
}

async function verifyBuildFiles(directory, request) {
  const baseUrl = 'https://validated-build.invalid/'
  return verifyPublishedRelease({ baseUrl, expectedManifest: readFileSync(join(directory, releaseManifestName)),
    target: { date: request.targetDate, day: request.daily.lesson.day, title: request.daily.lesson.title, sourceCommit: request.sourceCommit },
    fetchImpl: async input => {
      const url = new URL(String(input))
      requireValid(url.origin === new URL(baseUrl).origin && !url.pathname.includes('..'), 'Invalid local release path')
      const path = join(directory, decodeURIComponent(url.pathname.slice(1)))
      return existsSync(path) ? new Response(readFileSync(path)) : new Response('Missing', { status: 404 })
    },
  })
}

export function verifyTrustedBuildRun({ run, jobs, repository }) {
  requireValid(run.repository?.full_name === repository && run.head_repository?.full_name === repository, 'Build must come from this repository')
  requireValid([workflowPath, `${workflowPath}@main`, `${workflowPath}@refs/heads/main`].includes(run.path) && run.head_branch === 'main' &&
    ['push', 'workflow_dispatch', 'repository_dispatch'].includes(run.event), 'Build must come from the trusted main sync workflow')
  requireValid(run.status === 'completed' && run.conclusion === 'success', 'Sync run has not completed successfully')
  requireValid(Number.isSafeInteger(run.id) && run.id > 0 && Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0 && sha(run.head_sha), 'Invalid source run identity')
  const job = jobs.find(job => job.name === 'sync')
  requireValid(job?.status === 'completed' && job.conclusion === 'success' && job.run_id === run.id, 'Trusted sync job has not succeeded')
  for (const name of ['Verify shared automation contract', 'Verify successful upstream Pages run and post-deployment check',
    'Rebuild and verify published study snapshot', 'Verify locked 09:00 N1 source blob', 'Materialize requested daily JSON and validated snapshot',
    'Verify study snapshot import', 'Capture candidate source tree', 'Validate content', 'Unit tests', 'Build', 'Install browser', 'Browser tests',
    'Commit verified content with fast-forward protection', 'Seal validated build for Pages', 'Retain validated Pages build']) {
    requireValid(job.steps?.some(step => step.name === name && step.status === 'completed' && step.conclusion === 'success'), `Missing successful sync gate: ${name}`)
  }
}

/** The source run and exact commit tree must have passed the same gates Pages uses. */
export function verifyBuildProvenance({ proof, run, jobs, repository, commit, tree, parents }) {
  verifyTrustedBuildRun({ run, jobs, repository })
  requireValid(proof?.version === 1 && sha(proof.sourceCommit) && sha(proof.commit) && sha(proof.tree), 'Invalid validated build provenance')
  requireValid(proof.repository === repository && proof.runId === run.id && proof.runAttempt === run.run_attempt && proof.sourceCommit === run.head_sha, 'Build run/attempt/source mismatch')
  requireValid(proof.commit === commit && proof.tree === tree, 'Build is for another release commit or tree')
  requireValid(commit === proof.sourceCommit || (parents.length === 1 && parents[0] === proof.sourceCommit), 'Release is not the verified source or its direct sync child')
}

export async function sealValidatedBuild({ root, capture, output, repository, runId, runAttempt }) {
  requireValid(sha(capture?.sourceCommit) && sha(capture?.tree), 'Invalid captured source tree')
  const commit = git(root, ['rev-parse', 'HEAD']), tree = git(root, ['rev-parse', 'HEAD^{tree}'])
  const parents = git(root, ['show', '-s', '--format=%P', 'HEAD']).split(' ').filter(Boolean)
  requireValid(capture.tree === tree && (commit === capture.sourceCommit || (parents.length === 1 && parents[0] === capture.sourceCommit)), 'Committed source differs from the tested candidate')
  requireValid(changedPaths(root).length === 0, 'Source changed after validation')
  requireValid(typeof repository === 'string' && /^[\w.-]+\/[\w.-]+$/.test(repository) && Number.isSafeInteger(runId) && runId > 0 && Number.isSafeInteger(runAttempt) && runAttempt > 0, 'Invalid source run identity')
  const request = validateRequest(JSON.parse(readFileSync(join(root, '.github/n1-sync-request.json'), 'utf8')))
  const dist = join(root, 'dist')
  await verifyBuildFiles(dist, request)
  const proof = { version: 1, repository, runId, runAttempt, sourceCommit: capture.sourceCommit, commit, tree, files: inventory(dist) }
  cpSync(dist, join(output, 'dist'), { recursive: true, errorOnExist: true, force: false })
  writeFileSync(join(output, 'provenance.json'), JSON.stringify(proof, null, 2) + '\n')
  return proof
}

export async function verifyValidatedBuild({ root, directory, run, jobs, repository, expectedCommit }) {
  requireValid(lstatSync(join(directory, 'provenance.json')).isFile() && !lstatSync(join(directory, 'provenance.json')).isSymbolicLink(), 'Provenance must be a regular file')
  const proof = JSON.parse(readFileSync(join(directory, 'provenance.json'), 'utf8'))
  const commit = git(root, ['rev-parse', 'HEAD'])
  requireValid(commit === expectedCommit, 'Checkout does not match the requested Pages commit')
  verifyBuildProvenance({ proof, run, jobs, repository, commit,
    tree: git(root, ['rev-parse', 'HEAD^{tree}']), parents: git(root, ['show', '-s', '--format=%P', 'HEAD']).split(' ').filter(Boolean) })
  const dist = join(directory, 'dist')
  requireValid(JSON.stringify(inventory(dist)) === JSON.stringify(proof.files), 'Validated build file inventory/hash mismatch')
  const request = validateRequest(JSON.parse(readFileSync(join(root, '.github/n1-sync-request.json'), 'utf8')))
  await verifyBuildFiles(dist, request)
  return proof
}
