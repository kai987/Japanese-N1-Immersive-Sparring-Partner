import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { atomicJson, cleanupPublishedCache, pendingDeploymentForMain, recoverableCheckpoint, synchronizeWorkerControl, verifyWorkerReleaseAssets, retainWorkerReleaseProof, waitForWorkerDeployment } from '../scripts/audio-worker.ts'
import type { Manifest } from '../scripts/validate-audio.ts'
test('checkpoints replace complete JSON, and an interrupted temporary write does not corrupt prior state', () => {
  const root = mkdtempSync(join(tmpdir(), 'n1-audio-checkpoint-'))
  try {
    const path = join(root, 'progress.json')
    atomicJson(path, { phase: 'uploading', verified: ['one'] })
    writeFileSync(`${path}.partial`, '{broken')
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { phase: 'uploading', verified: ['one'] })
    atomicJson(path, { phase: 'complete', verified: ['one', 'two'] })
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).phase, 'complete')
    writeFileSync(path, '{corrupt-checkpoint')
    assert.deepEqual(recoverableCheckpoint(path, { version: 1 }), { version: 1 })
  } finally { rmSync(root, { recursive: true, force: true }) }
})
test('wrong-shaped checkpoints are quarantined byte-for-byte while legacy object records and uploads survive', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-checkpoint-shape-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const [index, bytes] of ['null\n', '[{"keep":"original"}]\n', '42\n', '"interrupted"\n', 'true\n'].entries()) {
    const path = join(root, `invalid-${index}.json`)
    writeFileSync(path, bytes)
    assert.deepEqual(recoverableCheckpoint(path, { version: 1 }), { version: 1 })
    assert.equal(existsSync(path), false)
    const preserved = readdirSync(root).find(name => name.startsWith(`invalid-${index}.json.invalid-`))!
    assert.equal(readFileSync(join(root, preserved), 'utf8'), bytes)
  }
  for (const value of [{ phase: 'uploading', retained: ['legacy-field'] }, { version: 1, phase: 'complete' }, { ['a'.repeat(16)]: { verified: true, sha256: 'b'.repeat(64) } }]) {
    const path = join(root, 'valid.json'), text = JSON.stringify(value)
    writeFileSync(path, text)
    assert.deepEqual(recoverableCheckpoint(path), value)
    assert.equal(readFileSync(path, 'utf8'), text)
  }
  t.mock.method(Date, 'now', () => 1234)
  const repeated = join(root, 'repeated.json')
  for (const bytes of ['null', '[]']) { writeFileSync(repeated, bytes); recoverableCheckpoint(repeated) }
  assert.equal(readFileSync(`${repeated}.invalid-1234`, 'utf8'), 'null')
  assert.equal(readFileSync(`${repeated}.invalid-1234-1`, 'utf8'), '[]')
})
test('a failed older deployment cannot pin recovery after main advances', () => {
  const old = 'a'.repeat(40), current = 'b'.repeat(40)
  assert.equal(pendingDeploymentForMain({ phase: 'retry_pending', releaseCommit: old }, old), old)
  assert.equal(pendingDeploymentForMain({ phase: 'retry_pending', releaseCommit: old }, current), null)
  assert.equal(pendingDeploymentForMain({ phase: 'complete', releaseCommit: old }, old), null)
  assert.equal(pendingDeploymentForMain({ phase: 'pushing', candidateCommit: old }, current), null)
})

test('a slow Pages run remains resumable and verifies only the exact successful run', async () => {
  const commit = 'a'.repeat(40)
  const active = { id: 123, head_sha: commit, status: 'in_progress', conclusion: null, run_attempt: 1 }
  const complete = { ...active, status: 'completed', conclusion: 'success' }
  let checkpoint: Parameters<typeof waitForWorkerDeployment>[0] = { commit }
  let polls = 0
  const verified: number[] = []
  const operations = {
    listRuns: async () => {
      polls++
      const runs = polls === 19 ? [] : [polls > 19 ? complete : active]
      return [...runs, { ...complete, id: 456, head_sha: 'b'.repeat(40) }]
    },
    save: (next: typeof checkpoint) => { checkpoint = next },
    verify: async (id: number) => { verified.push(id) },
    dispatch: async () => { assert.fail('must not dispatch a duplicate') },
    rerun: async () => { assert.fail('must not retry a running deployment') },
    wait: async () => {},
  }
  assert.equal(await waitForWorkerDeployment(checkpoint, operations), false)
  assert.equal(polls, 18)
  assert.deepEqual(verified, [])
  assert.equal(checkpoint.runId, 123)
  assert.equal(await waitForWorkerDeployment(checkpoint, operations), true)
  assert.deepEqual(verified, [123])
})

test('a missing push run allows one dispatch across waits while its run is not yet visible', async () => {
  let checkpoint: Parameters<typeof waitForWorkerDeployment>[0] = { commit: 'a'.repeat(40) }
  let dispatches = 0
  const operations = {
    listRuns: async () => [],
    save: (next: typeof checkpoint) => { checkpoint = next },
    verify: async () => { assert.fail('no exact run to verify') },
    dispatch: async () => { dispatches++ },
    rerun: async () => { assert.fail('no terminal run to retry') },
    wait: async () => {},
  }
  assert.equal(await waitForWorkerDeployment(checkpoint, operations), false)
  assert.equal(await waitForWorkerDeployment(checkpoint, operations), false)
  assert.equal(dispatches, 1)
  assert.equal(checkpoint.dispatchRequested, true)
})

test('only a confirmed failed Pages run is eligible for a same-ID retry', async () => {
  const commit = 'a'.repeat(40)
  const failed = { id: 123, head_sha: commit, status: 'completed', conclusion: 'failure', run_attempt: 1 }
  let checkpoint: Parameters<typeof waitForWorkerDeployment>[0] = { commit }
  let successful = false
  const reruns: number[] = [], verified: number[] = []
  const operations = {
    listRuns: async () => [successful ? { ...failed, conclusion: 'success', run_attempt: 2 } : failed],
    save: (next: typeof checkpoint) => { checkpoint = next },
    verify: async (id: number) => { verified.push(id) },
    dispatch: async () => { assert.fail('must retry the exact failed run') },
    rerun: async (id: number) => { reruns.push(id) },
    wait: async () => {},
  }
  await assert.rejects(waitForWorkerDeployment(checkpoint, operations), /Pages run 123 finished with failure/)
  assert.equal(await waitForWorkerDeployment(checkpoint, operations, checkpoint.runId), false)
  assert.equal(await waitForWorkerDeployment(checkpoint, operations), false, 'allow the rerun request to become visible')
  assert.deepEqual(reruns, [123])
  assert.deepEqual(verified, [])
  successful = true
  assert.equal(await waitForWorkerDeployment(checkpoint, operations), true)
  assert.deepEqual(verified, [123])
})

test('a rerun that fails within the same window is left for the next eligible opening', async () => {
  const commit = 'a'.repeat(40)
  let runAttempt = 1
  await assert.rejects(waitForWorkerDeployment({ commit, runId: 123 }, {
    listRuns: async () => [{ id: 123, head_sha: commit, status: 'completed', conclusion: 'failure', run_attempt: runAttempt }],
    save: () => {},
    verify: async () => { assert.fail('a failed run cannot verify a release') },
    dispatch: async () => { assert.fail('must not dispatch a replacement workflow') },
    rerun: async () => { runAttempt++ },
    wait: async () => {},
  }, 123), /Pages run 123 finished with failure/)
  assert.equal(runAttempt, 2)
})

test('cleanup removes only byte-verified published cache and retains unpublished candidates', () => {
  const root = mkdtempSync(join(tmpdir(), 'n1-audio-cleanup-'))
  try {
    const path = join(root, 'morioki-normal')
    mkdirSync(path)
    const published = 'a'.repeat(16), pending = 'b'.repeat(16), bytes = Buffer.from('verified recording')
    for (const id of [published, pending]) { writeFileSync(join(path, `${id}.mp3`), bytes); writeFileSync(join(path, `${id}.clip.json`), '{}') }
    cleanupPublishedCache(root, { clips: { [published]: { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') } } } as unknown as Manifest)
    assert.equal(existsSync(join(path, `${published}.mp3`)), false)
    assert.equal(existsSync(join(path, `${published}.clip.json`)), false)
    assert.equal(existsSync(join(path, `${pending}.mp3`)), true)
    assert.equal(existsSync(join(path, `${pending}.clip.json`)), true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('managed worker control accepts only clean main at the exact fetched remote commit', async () => {
  const main = 'a'.repeat(40), calls: string[][] = []
  const git = async (args: string[]) => {
    calls.push(args)
    if (args[0] === 'remote') return 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git'
    if (args[0] === 'symbolic-ref') return 'main'
    if (args[0] === 'rev-parse') return main
    return ''
  }
  assert.equal(await synchronizeWorkerControl('/unused-managed-checkout', git), main)
  assert.deepEqual(calls.find(args => args[0] === 'merge'), ['merge', '--ff-only', main])
  assert.ok(calls.some(args => args.join(' ') === 'merge-base --is-ancestor HEAD origin/main'))
})

for (const invalid of ['ahead', 'diverged', 'other-branch', 'detached', 'dirty', 'post-merge-head'] as const) {
  test(`worker refuses ${invalid} control state before catalog generation or upload`, async () => {
    const main = 'a'.repeat(40), calls: string[][] = []
    const git = async (args: string[]) => {
      calls.push(args)
      if (args[0] === 'remote') return 'https://github.com/kai987/Japanese-N1-Immersive-Sparring-Partner.git'
      if (args[0] === 'status') return invalid === 'dirty' ? ' M protected.txt' : ''
      if (args[0] === 'symbolic-ref') {
        if (invalid === 'detached') throw new Error('detached')
        return invalid === 'other-branch' ? 'review' : 'main'
      }
      if (args[0] === 'merge-base' && ['ahead', 'diverged'].includes(invalid)) throw new Error('not an ancestor')
      if (args[0] === 'rev-parse') return invalid === 'post-merge-head' && args[1] === 'HEAD' ? 'b'.repeat(40) : main
      return ''
    }
    await assert.rejects(synchronizeWorkerControl('/unused-managed-checkout', git))
    if (invalid !== 'post-merge-head') assert.equal(calls.some(args => args[0] === 'merge'), false)
    assert.equal(calls.some(args => ['reset', 'clean', 'checkout', 'push'].includes(args[0])), false)
  })
}

test('deployment recovery verifies the artifact from the exact successful run and removes only its temporary copy', async () => {
  const expected = Buffer.from('{"fixture":"exact-successful-build"}'), downloaded: string[][] = []
  let artifactDirectory = ''
  await verifyWorkerReleaseAssets(123456, undefined, {
    download: async args => {
      downloaded.push(args)
      artifactDirectory = args[args.indexOf('--dir') + 1]
      writeFileSync(join(artifactDirectory, 'n1-release.json'), expected)
      return ''
    },
    verify: async options => { assert.deepEqual(options.expectedManifest, expected); return {} as never },
  })
  assert.deepEqual(downloaded[0].slice(0, 3), ['run', 'download', '123456'])
  assert.ok(downloaded[0].includes('n1-deployment-verification'))
  assert.equal(existsSync(artifactDirectory), false)
})

test('new candidates use their local build proof and unavailable legacy artifacts cannot complete recovery', async t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-release-local-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const expected = Buffer.from('{"fixture":"local-candidate"}')
  writeFileSync(join(root, 'n1-release.json'), expected)
  await verifyWorkerReleaseAssets(123456, root, {
    download: async () => { throw new Error('must not download another build') },
    verify: async options => { assert.deepEqual(options.expectedManifest, expected); return {} as never },
  })
  assert.equal(readFileSync(join(root, 'n1-release.json'), 'utf8'), expected.toString())
  let checked = false
  await assert.rejects(verifyWorkerReleaseAssets(123456, undefined, {
    download: async () => { throw new Error('legacy artifact unavailable') },
    verify: async () => { checked = true; return {} as never },
  }), /legacy artifact unavailable/)
  assert.equal(checked, false)
})

test('retained candidate-bound proof survives missing artifacts and cannot be silently replaced', async t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-release-retained-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const expected = Buffer.from('{"fixture":"durable-exact-candidate"}'), commit = 'a'.repeat(40)
  const proof = retainWorkerReleaseProof(root, commit, expected)
  assert.equal(retainWorkerReleaseProof(root, commit, expected), proof)
  assert.throws(() => retainWorkerReleaseProof(root, commit, Buffer.from('{"different":true}')), /different verification proof/)
  assert.deepEqual(readFileSync(proof), expected)
  await verifyWorkerReleaseAssets(123456, undefined, {
    retainedProof: proof,
    download: async () => { throw new Error('artifact expired; retained proof must win') },
    verify: async options => { assert.deepEqual(options.expectedManifest, expected); return {} as never },
  })
  assert.deepEqual(readFileSync(proof), expected, 'a successful retry retains immutable recovery evidence')
})
