import { execFileSync } from 'node:child_process'
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { captureAudioBuildSource, captureBuildSource, sealValidatedBuild, validatedBuildArtifact, verifyTrustedBuildRun, verifyValidatedBuild } from './lib/validatedBuild.mjs'

export async function restoreValidatedBuild({ root, runId, repository, expectedCommit, api, download, now = Date.now, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (!runId) return { reused: false, reason: 'No validated sync run supplied' }
  if (!/^[1-9]\d*$/.test(runId)) return { reused: false, reason: 'Invalid source run ID; full validation required' }
  const directory = mkdtempSync(join(tmpdir(), 'n1-validated-build-'))
  try {
    const deadline = now() + 30_000
    let run
    // Dispatch is the sync workflow's final action; give that exact run a short
    // chance to finish before falling back to normal Pages validation.
    do {
      run = await api(`repos/${repository}/actions/runs/${runId}`)
      if (run.status === 'completed' || now() >= deadline) break
      await wait(2_000)
    } while (true)
    if (run.status !== 'completed' || run.conclusion !== 'success') throw new Error('Source sync run is not successful yet')
    if (run.id !== Number(runId) || !Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1) throw new Error('Source run identity mismatch')
    const jobs = await api(`repos/${repository}/actions/runs/${runId}/attempts/${run.run_attempt}/jobs?per_page=100`)
    verifyTrustedBuildRun({ run, jobs: jobs.jobs, repository })
    await download(runId, validatedBuildArtifact(run.run_attempt), directory)
    const proof = await verifyValidatedBuild({ root, directory, run, jobs: jobs.jobs, repository, expectedCommit })
    rmSync(join(root, 'dist'), { recursive: true, force: true })
    cpSync(join(directory, 'dist'), join(root, 'dist'), { recursive: true })
    return { reused: true, browserValidated: proof.kind !== 'audio', runId: run.id, runAttempt: run.run_attempt, commit: proof.commit, files: Object.keys(proof.files).length }
  } catch (error) {
    return { reused: false, reason: error instanceof Error ? error.message : 'Validated build unavailable' }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

export async function validatedBuildCommand(args, env = process.env) {
  const option = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1] }
  const root = resolve(option('--root') ?? '.'), mode = args[0]
  if (mode === 'capture') {
    const output = option('--output'), date = option('--date')
    const audio = args.includes('--audio')
    if (!output || (audio ? Boolean(date) : !date)) throw new Error('capture requires --output and exactly one of --date or --audio')
    writeFileSync(output, JSON.stringify(audio ? captureAudioBuildSource(root) : captureBuildSource(root, date)) + '\n')
  } else if (mode === 'seal') {
    const capture = option('--capture'), output = option('--output')
    if (!capture || !output) throw new Error('seal requires --capture and --output')
    await sealValidatedBuild({ root, capture: JSON.parse(readFileSync(capture, 'utf8')), output,
      repository: env.GITHUB_REPOSITORY, runId: Number(env.GITHUB_RUN_ID), runAttempt: Number(env.GITHUB_RUN_ATTEMPT) })
  } else if (mode === 'restore') {
    const result = await restoreValidatedBuild({ root, runId: env.VALIDATED_RUN_ID, repository: env.GITHUB_REPOSITORY, expectedCommit: env.GITHUB_SHA,
      api: path => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', timeout: 10_000, maxBuffer: 4 * 1024 * 1024 })),
      download: (run, name, directory) => execFileSync('gh', ['run', 'download', run, '--repo', env.GITHUB_REPOSITORY, '--name', name, '--dir', directory], { stdio: 'inherit', timeout: 120_000 }),
    })
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `reused=${result.reused}\nbrowser_validated=${result.reused && result.browserValidated}\n`)
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, result.reused
      ? `Reused validated source run ${result.runId}, attempt ${result.runAttempt}, exact commit ${result.commit}; all ${result.files} build files verified. Browser tests ${result.browserValidated ? 'already passed in the trusted daily run' : 'required in Pages shards'}.\n`
      : `Validated build not reused; all normal Pages checks will run. ${String(result.reason).replace(/[\r\n]/g, ' ')}\n`)
    console.log(JSON.stringify(result))
    return result
  } else throw new Error('Usage: validated-build.mjs capture|seal|restore')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await validatedBuildCommand(process.argv.slice(2))
