import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, existsSync, fstatSync, fsyncSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
import { ensureAudioUploaded } from './lib/audioUpload.ts'
import { mergeUploadedRecordings } from './lib/audioWorkerState.ts'
import type { Manifest } from './validate-audio.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'
import type { collectAudio } from './collect-audio.ts'

const repository = 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git'
const dailyRepository = 'https://github.com/kai987/japan-it-ai-daily.git'
const githubRepository = 'kai987/Japanese-N1-Immersive-Sparring-Partner'
const metadataPaths = ['public/audio/manifest.json', 'src/data/audio-index.json', 'src/data/audio-sources.json', 'src/data/audio-pending.json']
const sourceRoot = fileURLToPath(new URL('../', import.meta.url))
const abort = new AbortController()
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
async function run(command: string, args: string[], cwd = sourceRoot, environment: NodeJS.ProcessEnv = {}) {
  if (abort.signal.aborted) throw new Error('Worker interrupted; verified cache retained')
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GH_PROMPT_DISABLED: '1', ...environment }, stdio: ['ignore', 'pipe', 'pipe'] })
    const timeout = setTimeout(() => child.kill('SIGTERM'), 20 * 60_000)
    let stdout = '', stderr = ''
    const stop = () => child.kill('SIGTERM')
    abort.signal.addEventListener('abort', stop, { once: true })
    child.stdout.on('data', data => { stdout += data; if (stdout.length > 8_000_000) child.kill('SIGTERM') })
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-6000) })
    child.once('error', error => { clearTimeout(timeout); reject(error) })
    child.once('close', code => {
      abort.signal.removeEventListener('abort', stop)
      clearTimeout(timeout)
      if (code === 0) resolve(stdout.trim())
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
export function recoverableCheckpoint(path: string, fallback: Record<string, unknown> = {}) {
  if (!existsSync(path)) return fallback
  try { return readJson(path) as Record<string, unknown> } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    renameSync(path, `${path}.invalid-${Date.now()}`)
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
async function ensureEngine() {
  const ready = async () => {
    try { return (await fetch('http://127.0.0.1:10101/version', { signal: AbortSignal.timeout(3000) })).ok } catch { return false }
  }
  if (await ready()) return
  if (process.platform !== 'darwin') throw new Error('awaiting_local_engine: local AivisSpeech is unavailable')
  await run('open', ['-g', '-a', 'AivisSpeech'])
  for (let attempt = 0; attempt < 20; attempt++) {
    if (abort.signal.aborted) throw new Error('Worker interrupted')
    await new Promise(resolve => setTimeout(resolve, 2000))
    if (await ready()) return
  }
  throw new Error('awaiting_local_engine: AivisSpeech did not become ready')
}
async function verifyDeployment(commit: string, localDist?: string) {
  const path = `repos/${githubRepository}/actions/workflows/deploy-pages.yml/runs?head_sha=${commit}&branch=main&per_page=100`
  let dispatched = false
  for (let attempt = 0; attempt < 18; attempt++) {
    const { workflow_runs: all } = JSON.parse(await run('gh', ['api', path]))
    const runs = all.filter((r: { head_sha: string }) => r.head_sha === commit)
    if (runs.some((r: { status: string; conclusion: string }) => r.status === 'completed' && r.conclusion === 'success')) {
      const base = 'https://kai987.github.io/Japanese-N1-Immersive-Sparring-Partner/'
      const response = await fetch(base, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error('awaiting_live_verification: N1 page unavailable')
      const html = await response.text()
      const script = /<script[^>]+src="([^"]+\.js[^"]*)"/.exec(html)?.[1]
      if (!script) throw new Error('awaiting_live_verification: no application bundle')
      const asset = await fetch(new URL(script, base), { cache: 'no-store', signal: AbortSignal.timeout(30000) })
      if (!asset.ok) throw new Error('awaiting_live_verification: application bundle unavailable')
      const body = Buffer.from(await asset.arrayBuffer())
      if (localDist) {
        const expected = join(localDist, new URL(script, base).pathname.split('/').slice(-2).join('/'))
        if (!existsSync(expected) || createHash('sha256').update(readFileSync(expected)).digest('hex') !== createHash('sha256').update(body).digest('hex')) {
          throw new Error('awaiting_live_verification: deployed bundle differs; retry against current main')
        }
      }
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
    await new Promise(resolve => setTimeout(resolve, 15000))
  }
  throw new Error('awaiting_deploy: exact commit is not yet verified')
}

async function main() {
  const args = process.argv.slice(2), at = args.indexOf('--state-dir')
  const root = resolve(at >= 0 ? args[at + 1] : join(homedir(), 'Library/Application Support/N1 Audio'))
  const lockAt = args.indexOf('--lock-fd')
  if (lockAt < 0) {
    const result = await run('python3', [join(sourceRoot, 'scripts/audio-worker-lock.py'), root, process.execPath, fileURLToPath(import.meta.url)])
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
  const statePath = join(root, 'progress.json')
  let state: Record<string, unknown> = recoverableCheckpoint(statePath, { version: 1 })
  const phase = (value: string, fields: Record<string, unknown> = {}) => {
    state = { ...state, ...fields, phase: value, updatedAt: new Date().toISOString() }
    atomicJson(statePath, state)
    console.log(JSON.stringify({ phase: value, ...fields }))
  }
  let attempt = ''
  try {
    if (state.releaseCommit && state.phase !== 'complete') {
      const main = await run('gh', ['api', `repos/${githubRepository}/git/ref/heads/main`, '--jq', '.object.sha'])
      const pending = pendingDeploymentForMain(state, main)
      if (pending) {
        phase('awaiting_deploy')
        await verifyDeployment(pending)
        phase('complete', { lastError: null, lastVerifiedCommit: state.releaseCommit })
      } else phase('reconciling', { releaseCommit: null })
    }
    phase('fetching', { lastError: null, attempt: Number(state.attempt ?? 0) + 1 })
    const control = join(root, 'control')
    if (!existsSync(join(control, '.git'))) await atomicClone(repository, control, ['--single-branch', '--branch', 'main'])
    if (await run('git', ['remote', 'get-url', 'origin'], control) !== repository || await run('git', ['status', '--porcelain'], control)) throw new Error('Worker control checkout changed; preserve it for inspection')
    await run('git', ['fetch', '--no-tags', 'origin', 'main'], control)
    await run('git', ['merge', '--ff-only', 'origin/main'], control)
    const base = await run('git', ['rev-parse', 'HEAD'], control)
    const sourceCommit = await successfulAudioCommit()
    phase('catalog', { baseCommit: base, sourceAudioCommit: sourceCommit, releaseCommit: null })
    const attempts = join(root, 'attempts')
    mkdirSync(attempts, { recursive: true, mode: 0o700 })
    // Every attempt starts clean. Generated audio is retained separately.
    for (const name of readdirSync(attempts)) if (/^run-\d+-\d+$/.test(name)) rmSync(join(attempts, name), { recursive: true, force: true })
    attempt = join(attempts, `run-${Date.now()}-${process.pid}`)
    await run('git', ['clone', '--shared', '--no-hardlinks', control, attempt], root)
    await run('git', ['remote', 'set-url', 'origin', repository], attempt)
    await run('git', ['checkout', '--detach', base], attempt)
    const work = join(root, 'cache'), planPath = join(work, 'catalog.json')
    mkdirSync(work, { recursive: true, mode: 0o700 })
    await run(process.execPath, ['scripts/collect-audio.ts', planPath], attempt)
    const catalog = readJson(planPath) as ReturnType<typeof collectAudio>
    phase('deduplicating', { requiredClips: catalog.entries.length })
    const daily = await ensureDailyCheckout(root, sourceCommit)
    await run(process.execPath, ['scripts/sync-audio.ts', '--daily-repo', daily, '--ref', sourceCommit], attempt)
    const published = readJson(join(attempt, 'public/audio/manifest.json')) as Manifest
    const sources = readJson(join(attempt, 'src/data/audio-sources.json')) as AudioSources
    const index = readJson(join(attempt, 'src/data/audio-index.json'))
    const missing = catalog.entries.filter(entry => !sources.clips[entry.id])
    if (missing.length) {
      const neededDates = [...new Set(missing.flatMap(entry => entry.references.filter(ref => ref.startsWith('lesson/')).map(ref => ref.split('/')[1])))]
      const waitingDates = neededDates.filter(date => !existsSync(join(daily, 'public/audio/japanese', date, 'manifest.json')))
      if (waitingDates.length) {
        phase('waiting_daily_audio', { pendingClips: missing.length, waitingDates })
        return
      }
      phase('generating', { pendingClips: missing.length })
      await ensureEngine()
      await run('python3', ['scripts/generate-audio.py', '--plan', planPath, '--work-dir', work, '--workers', '4'], attempt)
      const candidate = readJson(join(work, 'manifest.json')) as Manifest
      const verified: Record<string, { path: string; sha256: string; bytes: number; verified: true }> = {}
      const helper = join(root, 'bin/n1-audio-keychain')
      let token: string | undefined
      const getToken = async () => token ??= await run(helper, ['get'])
      const progressPath = join(root, 'uploads.json')
      const uploads = recoverableCheckpoint(progressPath)
      phase('uploading', { pendingClips: missing.length })
      for (const entry of missing) {
        if (abort.signal.aborted) throw new Error('Worker interrupted; verified uploads retained')
        const clip = candidate.clips[entry.id]
        if (!clip || clip.text !== entry.text) throw new Error(`Missing generated recording: ${entry.id}`)
        const result = await ensureAudioUploaded(clip, join(work, 'morioki-normal', `${entry.id}.mp3`), { getToken })
        verified[entry.id] = { path: result.path, sha256: result.sha256, bytes: result.bytes, verified: true }
        uploads[entry.id] = { ...verified[entry.id], verifiedAt: new Date().toISOString() }
        atomicJson(progressPath, uploads)
        phase('uploading', { pendingClips: missing.length - Object.keys(verified).length })
      }
      const merged = mergeUploadedRecordings(catalog, published, index, sources, candidate, verified, new Date().toISOString())
      for (const [path, value] of metadataPaths.map((path, i) => [path, [merged.manifest, merged.index, merged.sources, merged.pending][i]] as const)) atomicJson(join(attempt, path), value)
    }
    if (!await run('git', ['diff', '--name-only', '--', ...metadataPaths], attempt)) {
      if (state.lastVerifiedCommit !== base) await verifyDeployment(base)
      cleanupPublishedCache(work, published)
      phase('complete', { pendingClips: 0, releaseCommit: base, lastVerifiedCommit: base, lastError: null })
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
    await run(process.execPath, ['scripts/validate-audio.ts'], attempt)
    await run('npm', ['test'], attempt)
    await run('npm', ['run', 'build'], attempt)
    await run('npm', ['run', 'test:e2e'], attempt, { N1_PREVIEW_PORT: String(await freePort()), N1_TEST_OUTPUT_DIR: join(attempt, 'test-results') })
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
    phase('pushing', { candidateCommit: commit })
    await run('git', ['-c', 'http.version=HTTP/1.1', '-c', 'http.postBuffer=16777216', 'push', 'origin', 'HEAD:main'], attempt)
    phase('awaiting_deploy', { releaseCommit: commit })
    await verifyDeployment(commit, join(attempt, 'dist'))
    // All new bytes were remotely verified before commit, and the exact release
    // passed Pages plus real playback tests. Only now remove generated MP3s.
    cleanupPublishedCache(work, readJson(join(attempt, 'public/audio/manifest.json')) as Manifest)
    phase('complete', { pendingClips: 0, lastVerifiedCommit: commit, lastError: null })
  } catch (error) {
    phase('retry_pending', { failedPhase: state.phase, lastError: error instanceof Error ? error.message : 'Audio worker failed', nextAttempt: 'next background interval or login/wake' })
    process.exitCode = 1
  } finally {
    if (attempt) rmSync(attempt, { recursive: true, force: true })
    release()
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
