import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, fstatSync, fsyncSync, linkSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { ensureAudioUploaded } from './lib/audioUpload.ts'
import { mergeUploadedRecordings } from './lib/audioWorkerState.ts'
import type { Manifest } from './validate-audio.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'
import type { collectAudio } from './collect-audio.ts'
import { runAudioValidation } from './lib/audioValidation.ts'
import { audioSchedule, audioWorkReason, readAudioSchedule, unfinishedAudio } from './audio-worker-schedule.ts'
import { releaseArtifactName, releaseManifestName, verifyPublishedRelease } from './lib/deploymentVerification.mjs'

const repository = 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git'
const dailyRepository = 'https://github.com/kai987/japan-it-ai-daily.git'
const githubRepository = 'kai987/Japanese-N1-Immersive-Sparring-Partner'
const metadataPaths = ['public/audio/manifest.json', 'src/data/audio-index.json', 'src/data/audio-sources.json', 'src/data/audio-pending.json']
const sourceRoot = fileURLToPath(new URL('../', import.meta.url))
const abort = new AbortController()
let windowDeadline = Infinity
let deadlineReason = 'audio_window_ended'
function checkRunning() {
  if (Date.now() >= windowDeadline) abort.abort(deadlineReason)
  if (abort.signal.aborted) throw new Error('Worker interrupted; verified cache retained')
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => abort.abort())

export function atomicJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const temporary = `${path}.partial`
  const descriptor = openSync(temporary, 'w', 0o600)
  try { writeFileSync(descriptor, JSON.stringify(value, null, 2) + '\n'); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  renameSync(temporary, path)
}
export function pendingDeploymentForMain(state: Record<string, unknown>, main: string) {
  return state.phase !== 'complete' && typeof state.releaseCommit === 'string'
    && /^[a-f0-9]{40}$/.test(state.releaseCommit) && state.releaseCommit === main ? state.releaseCommit : null
}
async function run(command: string, args: string[], cwd = sourceRoot, environment: NodeJS.ProcessEnv = {}, timeoutMs = 20 * 60_000) {
  checkRunning()
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GH_PROMPT_DISABLED: '1', ...environment }, stdio: ['ignore', 'pipe', 'pipe'] })
    let forceStop: ReturnType<typeof setTimeout> | undefined
    const stop = () => { child.kill('SIGTERM'); forceStop ??= setTimeout(() => child.kill('SIGKILL'), 10_000) }
    const timeout = setTimeout(stop, timeoutMs)
    let stdout = '', stderr = ''
    abort.signal.addEventListener('abort', stop, { once: true })
    child.stdout.on('data', data => { stdout += data; if (stdout.length > 8_000_000) child.kill('SIGTERM') })
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-6000) })
    child.once('error', error => { clearTimeout(timeout); clearTimeout(forceStop); reject(error) })
    child.once('close', code => {
      abort.signal.removeEventListener('abort', stop)
      clearTimeout(timeout)
      clearTimeout(forceStop)
      if (abort.signal.aborted || Date.now() >= windowDeadline) reject(new Error('Worker interrupted; verified cache retained'))
      else if (code === 0) resolve(stdout.trim())
      else reject(new Error(`${basename(command)} failed (${code ?? 'terminated'}): ${stderr.slice(-2000) || stdout.slice(-2000)}`))
    })
  })
}
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
async function atomicClone(remote: string, target: string, options: string[]) {
  const temporary = mkdtempSync(join(dirname(target), '.clone-'))
  try {
    await run('git', ['clone', ...options, remote, temporary], dirname(target))
    renameSync(temporary, target)
  } finally { rmSync(temporary, { recursive: true, force: true }) }
}
/** Only the managed control checkout may advance, and only to exact remote main. */
export async function synchronizeWorkerControl(control: string, git = (args: string[]) => run('git', args, control)) {
  if (await git(['remote', 'get-url', 'origin']) !== repository || await git(['status', '--porcelain'])
    || await git(['symbolic-ref', '--short', 'HEAD']) !== 'main') throw new Error('Worker control checkout changed; preserve it for inspection')
  await git(['fetch', '--no-tags', 'origin', 'main'])
  try { await git(['merge-base', '--is-ancestor', 'HEAD', 'origin/main']) }
  catch { throw new Error('Worker control checkout is ahead of or diverged from remote main; preserve it for inspection') }
  const main = await git(['rev-parse', 'origin/main'])
  if (!/^[a-f0-9]{40}$/.test(main)) throw new Error('Worker remote main has no valid immutable commit')
  await git(['merge', '--ff-only', main])
  if (await git(['rev-parse', 'HEAD']) !== main || await git(['symbolic-ref', '--short', 'HEAD']) !== 'main'
    || await git(['status', '--porcelain'])) throw new Error('Worker control checkout differs from exact remote main; preserve it for inspection')
  return main
}
export function recoverableCheckpoint(path: string, fallback: Record<string, unknown> = {}) {
  if (!existsSync(path)) return fallback
  try {
    const value: unknown = readJson(path)
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SyntaxError('Checkpoint must contain an object')
    return value as Record<string, unknown>
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    const prefix = `${path}.invalid-${Date.now()}`
    let preserved = prefix, suffix = 0
    while (existsSync(preserved)) preserved = `${prefix}-${++suffix}`
    renameSync(path, preserved)
    return fallback
  }
}
export function cleanupPublishedCache(work: string, manifest: Manifest) {
  const path = join(work, 'morioki-normal')
  if (!existsSync(path)) return
  for (const name of readdirSync(path)) {
    const id = /^([a-f0-9]{16})\.mp3$/.exec(name)?.[1]
    const clip = id && manifest.clips[id]
    if (!clip) continue
    const bytes = readFileSync(join(path, name))
    if (bytes.length !== clip.bytes || createHash('sha256').update(bytes).digest('hex') !== clip.sha256) continue
    rmSync(join(path, name))
    rmSync(join(path, `${id}.clip.json`), { force: true })
  }
}
async function freePort() {
  const server = createServer()
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  if (!port) throw new Error('Unable to allocate isolated browser-test port')
  return port
}
async function successfulAudioCommit() {
  const value = JSON.parse(await run('gh', ['api', 'repos/kai987/japan-it-ai-daily/actions/workflows/sync-r2-audio.yml/runs?branch=main&status=success&per_page=100']))
  const found = value.workflow_runs.find((r: { head_sha: string; head_branch: string; status: string; conclusion: string; path: string; head_repository?: { full_name: string } }) =>
    /^[a-f0-9]{40}$/.test(r.head_sha) && r.head_branch === 'main' && r.status === 'completed' && r.conclusion === 'success'
    && r.path === '.github/workflows/sync-r2-audio.yml' && r.head_repository?.full_name === 'kai987/japan-it-ai-daily')
  if (!found) throw new Error('waiting_daily_audio: no verified upstream R2 commit')
  return found.head_sha as string
}
async function ensureDailyCheckout(root: string, commit: string) {
  const path = join(root, 'daily-manifests')
  if (!existsSync(join(path, '.git'))) {
    await atomicClone(dailyRepository, path, ['--filter=blob:none', '--no-checkout', '--depth=1', '--single-branch'])
  }
  if (await run('git', ['remote', 'get-url', 'origin'], path) !== dailyRepository) throw new Error('Unexpected upstream manifest checkout')
  await run('git', ['sparse-checkout', 'set', '--no-cone', '/public/audio/japanese/**/manifest.json', '/public/audio/japanese/**/interview-manifest.json'], path)
  await run('git', ['fetch', '--depth=1', '--no-tags', 'origin', commit], path)
  await run('git', ['checkout', '--detach', commit], path)
  return path
}
function shutdownEvidence(output: string) {
  const line = output.split('\n').filter(line => line.startsWith('AIVIS_LIFECYCLE_JSON=')).at(-1)
  if (!line) return { status: 'deferred', reason: 'missing_shutdown_evidence' }
  try { return JSON.parse(line.slice('AIVIS_LIFECYCLE_JSON='.length)) as Record<string, unknown> }
  catch { return { status: 'deferred', reason: 'invalid_shutdown_evidence' } }
}
export function retainedWorkerReleasePath(directory: string, commit: string) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Audio verification proof requires an immutable commit')
  return join(directory, commit, releaseManifestName)
}
export function retainWorkerReleaseProof(directory: string, commit: string, expected: Uint8Array) {
  const destination = retainedWorkerReleasePath(directory, commit)
  mkdirSync(dirname(destination), { recursive: true, mode: 0o700 })
  if (existsSync(destination)) {
    if (!readFileSync(destination).equals(Buffer.from(expected))) throw new Error('A different verification proof already exists for this audio commit; preserve both for inspection')
    return destination
  }
  const temporary = `${destination}.partial-${randomUUID()}`
  const descriptor = openSync(temporary, 'wx', 0o600)
  try { writeFileSync(descriptor, expected); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  try {
    // Linking never replaces an existing immutable proof, including a race.
    try { linkSync(temporary, destination) }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || !readFileSync(destination).equals(Buffer.from(expected))) throw error
    }
  } finally { rmSync(temporary, { force: true }) }
  return destination
}
export async function verifyWorkerReleaseAssets(runId: number, localDist?: string, dependencies: {
  download?: (args: string[]) => Promise<string>
  verify?: typeof verifyPublishedRelease
  retainedProof?: string
} = {}) {
  if (!Number.isSafeInteger(runId) || runId < 1) throw new Error('awaiting_live_verification: invalid exact deployment run')
  let temporary: string | undefined
  try {
    let expectedManifest: Buffer
    if (localDist) expectedManifest = readFileSync(join(localDist, releaseManifestName))
    else if (dependencies.retainedProof && existsSync(dependencies.retainedProof)) expectedManifest = readFileSync(dependencies.retainedProof)
    else {
      const directory = temporary = mkdtempSync(join(tmpdir(), 'n1-deployment-proof-'))
      await (dependencies.download ?? (args => run('gh', args)))([
        'run', 'download', String(runId), '--repo', githubRepository, '--name', releaseArtifactName, '--dir', directory,
      ])
      expectedManifest = readFileSync(join(directory, releaseManifestName))
    }
    // Recovery is tied to this exact successful run's retained build artifact.
    // A legacy run without the artifact remains pending instead of trusting
    // whichever HTML or lazy data happens to be publicly available.
    return await (dependencies.verify ?? verifyPublishedRelease)({
      baseUrl: 'https://kai987.github.io/Japanese-N1-Immersive-Sparring-Partner/',
      expectedManifest, signal: abort.signal,
    })
  } finally { if (temporary) rmSync(temporary, { recursive: true, force: true }) }
}
async function verifyDeployment(commit: string, localDist?: string, verificationDirectory?: string) {
  const path = `repos/${githubRepository}/actions/workflows/deploy-pages.yml/runs?head_sha=${commit}&branch=main&per_page=100`
  let dispatched = false
  for (let attempt = 0; attempt < 18; attempt++) {
    const { workflow_runs: all } = JSON.parse(await run('gh', ['api', path]))
    const runs = all.filter((r: { head_sha: string }) => r.head_sha === commit)
    const successful = runs.find((r: { id: number; status: string; conclusion: string }) => r.status === 'completed' && r.conclusion === 'success' && Number.isSafeInteger(r.id) && r.id > 0)
    if (successful) {
      await verifyWorkerReleaseAssets(successful.id, localDist, { retainedProof: verificationDirectory ? retainedWorkerReleasePath(verificationDirectory, commit) : undefined })
      return true
    }
    const active = runs.some((r: { status: string }) => ['queued', 'requested', 'pending', 'waiting', 'in_progress'].includes(r.status))
    if (!active && !dispatched && attempt > 0) {
      const main = await run('gh', ['api', `repos/${githubRepository}/git/ref/heads/main`, '--jq', '.object.sha'])
      if (main !== commit) throw new Error('awaiting_rebase: main advanced before deployment')
      await run('gh', ['workflow', 'run', 'deploy-pages.yml', '--repo', githubRepository, '--ref', 'main'])
      dispatched = true
    }
    if (abort.signal.aborted) throw new Error('Worker interrupted')
    await delay(15000, undefined, { signal: abort.signal })
  }
  throw new Error('awaiting_deploy: exact commit is not yet verified')
}

export type AudioRepair = { dates: string[]; liveUnitIds?: string[]; evidenceDirectory: string; entrypoint: string; deadline: number }
export function assertRepairScope(catalog: ReturnType<typeof collectAudio>, sources: AudioSources, dates: string[], liveUnitIds: string[] = []) {
  if (!dates.length || new Set(dates).size !== dates.length || dates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !catalog.lessonDates.includes(date))) {
    throw new Error('Repair requires explicit existing lesson dates')
  }
  const knownLiveUnits = new Set(catalog.entries.flatMap(entry => entry.references
    .filter(reference => reference.startsWith('live/')).map(reference => reference.split('/')[1])))
  if (new Set(liveUnitIds).size !== liveUnitIds.length || liveUnitIds.some(id => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !knownLiveUnits.has(id))) {
    throw new Error('Repair requires explicit existing live unit IDs')
  }
  for (const entry of catalog.entries.filter(entry => !sources.clips[entry.id])) {
    if (!entry.references.length || entry.references.some(reference => {
      const [kind, id] = reference.split('/')
      return !((kind === 'lesson' && dates.includes(id)) || (kind === 'live' && liveUnitIds.includes(id)))
    })) throw new Error(`Repair would include unapproved audio: ${entry.id}`)
  }
}
export async function audioWorker(repair?: AudioRepair) {
  const args = process.argv.slice(2), at = args.indexOf('--state-dir')
  const root = resolve(at >= 0 ? args[at + 1] : join(homedir(), 'Library/Application Support/N1 Audio'))
  const regularSchedule = audioSchedule(new Date(), readAudioSchedule(root))
  // Explicit repair is a bounded foreground transaction, not a new calendar or latch reset.
  const schedule = repair ? { ...regularSchedule, allowed: true, deadline: new Date(repair.deadline) } : regularSchedule
  if (!schedule.allowed) {
    console.log(JSON.stringify({ phase: 'scheduled_pause', reason: schedule.reason, nextOpening: schedule.nextOpening.toISOString() }))
    return
  }
  const lockAt = args.indexOf('--lock-fd')
  if (lockAt < 0) {
    const result = await run('python3', [join(sourceRoot, 'scripts/audio-worker-lock.py'), root, process.execPath, repair?.entrypoint ?? fileURLToPath(import.meta.url)], sourceRoot, repair ? { N1_AUDIO_REPAIR_CONFIG: JSON.stringify(repair) } : {}, schedule.deadline.getTime() - Date.now() + 30_000)
    if (result) console.log(result)
    return
  }
  const lock = Number(args[lockAt + 1])
  if (!Number.isInteger(lock) || lock < 3 || process.env.N1_AUDIO_LOCK_OWNER !== String(process.pid)
    || process.env.N1_AUDIO_LOCK_FD !== String(lock)) throw new Error('Worker requires its inherited operating-system lock')
  const held = fstatSync(lock), named = statSync(join(root, 'worker.process.lock'))
  if (!held.isFile() || held.ino !== named.ino || held.dev !== named.dev) throw new Error('Worker lock identity differs')
  delete process.env.N1_AUDIO_LOCK_FD
  delete process.env.N1_AUDIO_LOCK_OWNER
  const release = () => closeSync(lock)
  windowDeadline = schedule.deadline.getTime()
  deadlineReason = repair ? 'audio_repair_timeout' : 'audio_window_ended'
  const deadlineTimer = setTimeout(() => abort.abort(deadlineReason), Math.max(0, windowDeadline - Date.now()))
  const statePath = join(root, 'progress.json')
  let state: Record<string, unknown> = recoverableCheckpoint(statePath, { version: 1 })
  const phase = (value: string, fields: Record<string, unknown> = {}) => {
    state = { ...state, ...fields, phase: value, updatedAt: new Date().toISOString() }
    atomicJson(statePath, state)
    console.log(JSON.stringify({ phase: value, ...fields }))
  }
  let attempt = ''
  let diagnostics = ''
  let usedEngine = false
  let claimed = false
  const claim = (reason: string) => {
    checkRunning()
    // Called under the OS lock, before waiting for upstream audio or synthesis.
    if (!repair) atomicJson(join(root, 'schedule.json'), { version: 1, claimedDate: schedule.date, reason, startedAt: new Date().toISOString() })
    claimed = true
    phase('detected', { jobPending: true, detectedReason: reason, nextAttempt: schedule.nextOpening.toISOString() })
  }
  try {
    // Recheck under the lock: simultaneous manual/login/calendar triggers share one latch.
    if (!repair && !audioSchedule(new Date(), readAudioSchedule(root)).allowed) return
    if (unfinishedAudio(state)) claim('resume_pending')
    if (!repair && state.releaseCommit && state.phase !== 'complete') {
      const main = await run('gh', ['api', `repos/${githubRepository}/git/ref/heads/main`, '--jq', '.object.sha'])
      const pending = pendingDeploymentForMain(state, main)
      if (pending) {
        phase('awaiting_deploy')
        await verifyDeployment(pending, undefined, join(root, 'verification'))
        phase('complete', { jobPending: false, lastError: null, lastVerifiedCommit: state.releaseCommit })
        return
      } else phase('reconciling', { releaseCommit: null })
    }
    phase('fetching', { lastError: null, attempt: Number(state.attempt ?? 0) + 1 })
    const control = join(root, 'control')
    if (!existsSync(join(control, '.git'))) await atomicClone(repository, control, ['--single-branch', '--branch', 'main'])
    const base = await synchronizeWorkerControl(control)
    phase('catalog', { baseCommit: base, releaseCommit: null })
    const attempts = join(root, 'attempts')
    mkdirSync(attempts, { recursive: true, mode: 0o700 })
    // Every attempt starts clean. Generated audio is retained separately.
    for (const name of readdirSync(attempts)) if (/^run-\d+-\d+$/.test(name)) rmSync(join(attempts, name), { recursive: true, force: true })
    attempt = join(attempts, `run-${Date.now()}-${process.pid}`)
    diagnostics = repair?.evidenceDirectory ?? join(root, 'logs/validation', basename(attempt))
    await run('git', ['clone', '--shared', '--no-hardlinks', control, attempt], root)
    await run('git', ['remote', 'set-url', 'origin', repository], attempt)
    await run('git', ['checkout', '--detach', base], attempt)
    const work = join(root, 'cache'), planPath = join(work, 'catalog.json')
    mkdirSync(work, { recursive: true, mode: 0o700 })
    await run(process.execPath, ['scripts/collect-audio.ts', planPath], attempt)
    const catalog = readJson(planPath) as ReturnType<typeof collectAudio>
    const previousSources = readJson(join(attempt, 'src/data/audio-sources.json')) as AudioSources
    if (repair) {
      assertRepairScope(catalog, previousSources, repair.dates, repair.liveUnitIds)
      atomicJson(join(repair.evidenceDirectory, 'repair-scope.json'), { dates: repair.dates, liveUnitIds: repair.liveUnitIds ?? [], baseCommit: base, requiredClips: catalog.entries.length, missingIds: catalog.entries.filter(entry => !previousSources.clips[entry.id]).map(entry => entry.id), startedAt: new Date().toISOString() })
    }
    if (!claimed) {
      const reason = audioWorkReason(state, schedule.date, catalog.lessonDates, catalog.entries.filter(entry => !previousSources.clips[entry.id]).length, base)
      if (!reason) { phase('idle', { jobPending: false }); return }
      claim(reason)
    }
    const sourceCommit = await successfulAudioCommit()
    phase('deduplicating', { sourceAudioCommit: sourceCommit, requiredClips: catalog.entries.length })
    const daily = await ensureDailyCheckout(root, sourceCommit)
    await run(process.execPath, ['scripts/sync-audio.ts', '--daily-repo', daily, '--ref', sourceCommit], attempt)
    const published = readJson(join(attempt, 'public/audio/manifest.json')) as Manifest
    const sources = readJson(join(attempt, 'src/data/audio-sources.json')) as AudioSources
    const index = readJson(join(attempt, 'src/data/audio-index.json'))
    if (repair) assertRepairScope(catalog, sources, repair.dates, repair.liveUnitIds)
    const missing = catalog.entries.filter(entry => !sources.clips[entry.id])
    if (missing.length) {
      const neededDates = [...new Set(missing.flatMap(entry => entry.references.filter(ref => ref.startsWith('lesson/')).map(ref => ref.split('/')[1])))]
      const waitingDates = neededDates.filter(date => !existsSync(join(daily, 'public/audio/japanese', date, 'manifest.json')))
      if (waitingDates.length) {
        phase('waiting_daily_audio', { pendingClips: missing.length, waitingDates })
        return
      }
      phase('generating', { pendingClips: missing.length })
      usedEngine = true
      await runAudioValidation('python3', [join(sourceRoot, 'scripts/aivis-session.py'), '--', 'python3', 'scripts/generate-audio.py', '--plan', planPath, '--work-dir', work, '--workers', '4'], { cwd: attempt, directory: join(diagnostics, 'generation'), signal: abort.signal, timeoutMs: Math.min(20 * 60_000, windowDeadline - Date.now()) })
      const candidate = readJson(join(work, 'manifest.json')) as Manifest
      const verified: Record<string, { path: string; sha256: string; bytes: number; verified: true }> = {}
      const helper = join(root, 'bin/n1-audio-keychain')
      let token: string | undefined
      const getToken = async () => token ??= await run(helper, ['get'])
      const progressPath = join(root, 'uploads.json')
      const uploads = recoverableCheckpoint(progressPath)
      phase('uploading', { pendingClips: missing.length })
      for (const entry of missing) {
        checkRunning()
        const clip = candidate.clips[entry.id]
        if (!clip || clip.text !== entry.text) throw new Error(`Missing generated recording: ${entry.id}`)
        const result = await ensureAudioUploaded(clip, join(work, 'morioki-normal', `${entry.id}.mp3`), { getToken, signal: abort.signal })
        verified[entry.id] = { path: result.path, sha256: result.sha256, bytes: result.bytes, verified: true }
        uploads[entry.id] = { ...verified[entry.id], verifiedAt: new Date().toISOString(), uploaded: result.uploaded, uploadAttempts: result.attempts }
        atomicJson(progressPath, uploads)
        phase('uploading', { pendingClips: missing.length - Object.keys(verified).length })
      }
      if (repair) atomicJson(join(diagnostics, 'verified-uploads.json'), Object.fromEntries(missing.map(entry => [entry.id, { ...uploads[entry.id] as object, references: entry.references }])))
      const merged = mergeUploadedRecordings(catalog, published, index, sources, candidate, verified, new Date().toISOString())
      for (const [path, value] of metadataPaths.map((path, i) => [path, [merged.manifest, merged.index, merged.sources, merged.pending][i]] as const)) atomicJson(join(attempt, path), value)
    }
    if (!await run('git', ['diff', '--name-only', '--', ...metadataPaths], attempt)) {
      if (state.lastVerifiedCommit !== base) await verifyDeployment(base, undefined, join(root, 'verification'))
      if (!repair) cleanupPublishedCache(work, published)
      phase('complete', { jobPending: false, pendingClips: 0, releaseCommit: base, lastVerifiedCommit: base, lastError: null })
      return
    }
    phase('validating', { pendingClips: 0 })
    const lockHash = createHash('sha256').update(readFileSync(join(attempt, 'package-lock.json'))).digest('hex')
    const dependencies = join(root, 'dependencies', lockHash)
    if (!existsSync(join(dependencies, 'complete.json'))) {
      rmSync(join(dependencies, 'node_modules'), { recursive: true, force: true })
      mkdirSync(dependencies, { recursive: true, mode: 0o700 })
      for (const file of ['package.json', 'package-lock.json']) writeFileSync(join(dependencies, file), readFileSync(join(attempt, file)))
      await run('npm', ['ci', '--no-audit', '--no-fund'], dependencies)
      await run(join(dependencies, 'node_modules/.bin/playwright'), ['install', 'chromium'], dependencies)
      atomicJson(join(dependencies, 'complete.json'), { lockHash, installedAt: new Date().toISOString() })
    }
    symlinkSync(join(dependencies, 'node_modules'), join(attempt, 'node_modules'), 'dir')
    const validate = (name: string, command: string, args: string[], env: NodeJS.ProcessEnv = {}) => runAudioValidation(command, args, {
      cwd: attempt, directory: join(diagnostics, name), env, signal: abort.signal,
      timeoutMs: Math.min(20 * 60_000, windowDeadline - Date.now()),
    })
    phase('validating', { validationDirectory: diagnostics })
    await validate('audio', process.execPath, ['scripts/validate-audio.ts'])
    await validate('unit', 'npm', ['test'])
    await validate('build', 'npm', ['run', 'build'])
    await validate('e2e', 'npm', ['run', 'test:e2e', '--', '--reporter=line,json,html', '--trace=retain-on-failure'], {
      N1_PREVIEW_PORT: String(await freePort()), N1_TEST_OUTPUT_DIR: join(diagnostics, 'e2e/test-results'),
      PLAYWRIGHT_HTML_REPORT: join(diagnostics, 'e2e/playwright-report'), PLAYWRIGHT_HTML_OPEN: 'never',
      PLAYWRIGHT_JSON_OUTPUT_FILE: join(diagnostics, 'e2e/playwright.json'),
      ...(repair ? { N1_AUDIO_VERIFY_DATES: repair.dates.join(',') } : {}),
    })
    await run('git', ['diff', '--check'], attempt)
    await run('git', ['add', '--', ...metadataPaths], attempt)
    const changed = await run('git', ['diff', '--cached', '--name-only'], attempt)
    await run(process.execPath, ['scripts/verify-audio-changed-paths.ts', changed], attempt)
    await run('git', ['fetch', '--no-tags', 'origin', 'main'], attempt)
    if (await run('git', ['rev-parse', 'origin/main'], attempt) !== base) throw new Error('awaiting_rebase: main advanced; cached recordings retained')
    const actor = JSON.parse(await run('gh', ['api', 'user']))
    await run('git', ['config', 'user.name', actor.login], attempt)
    await run('git', ['config', 'user.email', `${actor.id}+${actor.login}@users.noreply.github.com`], attempt)
    await run('git', ['commit', '-m', 'content: publish verified incremental N1 audio'], attempt)
    const commit = await run('git', ['rev-parse', 'HEAD'], attempt)
    retainWorkerReleaseProof(join(root, 'verification'), commit, readFileSync(join(attempt, 'dist', releaseManifestName)))
    phase('pushing', { candidateCommit: commit })
    await run('git', ['-c', 'http.version=HTTP/1.1', '-c', 'http.postBuffer=16777216', 'push', 'origin', 'HEAD:main'], attempt)
    phase('awaiting_deploy', { releaseCommit: commit })
    await verifyDeployment(commit, join(attempt, 'dist'), join(root, 'verification'))
    // All new bytes were remotely verified before commit, and the exact release
    // passed Pages plus real playback tests. Only now remove generated MP3s.
    if (!repair) cleanupPublishedCache(work, readJson(join(attempt, 'public/audio/manifest.json')) as Manifest)
    phase('complete', { jobPending: false, pendingClips: 0, lastVerifiedCommit: commit, lastError: null })
  } catch (error) {
    const windowEnded = !repair && (abort.signal.reason === 'audio_window_ended' || Date.now() >= windowDeadline)
    phase(windowEnded ? 'paused_window' : 'retry_pending', { failedPhase: state.phase, lastError: windowEnded ? 'Japan time audio window ended; verified progress retained' : error instanceof Error ? error.message : 'Audio worker failed', nextAttempt: claimed || windowEnded ? schedule.nextOpening.toISOString() : 'next 15-minute check inside the Japan time window' })
    if (!windowEnded) process.exitCode = 1
  } finally {
    clearTimeout(deadlineTimer)
    if (usedEngine) {
      const log = join(diagnostics, 'generation/stdout.log')
      let cleanup = shutdownEvidence(existsSync(log) ? readFileSync(log, 'utf8') : '')
      // A different batch may have been recording when synthesis finished.
      // Retry only normal local cleanup; never restart synthesis or reset the latch.
      if (cleanup.status !== 'closed' && !abort.signal.aborted) {
        try {
          const output = await runAudioValidation('python3', [join(sourceRoot, 'scripts/aivis-session.py'), '--quit-only'], {
            cwd: sourceRoot, directory: join(diagnostics, 'shutdown'), timeoutMs: 45_000,
          })
          cleanup = shutdownEvidence(output)
        } catch {
          const shutdownLog = join(diagnostics, 'shutdown/stdout.log')
          cleanup = shutdownEvidence(existsSync(shutdownLog) ? readFileSync(shutdownLog, 'utf8') : '')
        }
      }
      state = { ...state, appCleanup: cleanup, updatedAt: new Date().toISOString() }
      atomicJson(statePath, state)
      console.log(JSON.stringify({ appCleanup: cleanup }))
    }
    if (attempt) rmSync(attempt, { recursive: true, force: true })
    release()
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await audioWorker()
