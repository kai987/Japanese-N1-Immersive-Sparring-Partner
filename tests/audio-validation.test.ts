import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { runAudioValidation } from '../scripts/lib/audioValidation.ts'

async function directory(t: test.TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'n1-audio-validation-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}
const record = async (root: string) => JSON.parse(await readFile(join(root, 'run.json'), 'utf8'))

async function waitForOutput(root: string, stream: 'stdout' | 'stderr', expected: string) {
  for (let attempt = 0; attempt < 500; attempt++) {
    try { if ((await readFile(join(root, `${stream}.log`), 'utf8')).includes(expected)) return }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    await delay(10)
  }
  assert.fail(`The validation fixture's ${stream} did not become ready`)
}

test('failed validation retains full stdout despite npm stderr notices, with both error tails', async t => {
  const root = await directory(t)
  // Exceed the worker's former 8 MB in-memory cap as well as the error-tail cap.
  const script = "process.stdout.write('x'.repeat(9000000) + '\\nPLAYWRIGHT_ASSERTION_MARKER\\n');process.stderr.write('npm notice running tests\\n');process.exitCode=1"
  await assert.rejects(runAudioValidation(process.execPath, ['-e', script], {
    cwd: root, directory: root, env: { VALIDATION_PRIVATE_SENTINEL: 'must-not-appear-in-run-json' },
  }), (error: unknown) => {
    assert.match(String(error), /exit 1/)
    assert.ok(String(error).includes(root))
    assert.match(String(error), /stdout \(last 8192 bytes\):[\s\S]*PLAYWRIGHT_ASSERTION_MARKER/)
    assert.match(String(error), /stderr \(last 8192 bytes\):[\s\S]*npm notice running tests/)
    assert.ok(String(error).length < 17000)
    return true
  })
  assert.equal(await readFile(join(root, 'stdout.log'), 'utf8'), 'x'.repeat(9000000) + '\nPLAYWRIGHT_ASSERTION_MARKER\n')
  assert.equal(await readFile(join(root, 'stderr.log'), 'utf8'), 'npm notice running tests\n')
  const run = await record(root)
  assert.equal(run.exitCode, 1)
  assert.equal(run.signal, null)
  assert.equal(run.aborted, false)
  assert.equal(run.timedOut, false)
  assert.ok(run.startedAt && run.endedAt && run.pid)
  assert.equal(run.stdoutBytes, Buffer.byteLength('x'.repeat(9000000) + '\nPLAYWRIGHT_ASSERTION_MARKER\n'))
  assert.equal(run.stderrBytes, Buffer.byteLength('npm notice running tests\n'))
  assert.deepEqual(run.args, ['-e', script])
  assert.equal('env' in run, false)
  assert.ok(!JSON.stringify(run).includes('must-not-appear-in-run-json'))
  if (process.platform !== 'win32') assert.equal((await stat(join(root, 'stdout.log'))).mode & 0o777, 0o600)
})

test('successful validation returns stdout and preserves both complete streams and its exit', async t => {
  const root = await directory(t)
  const result = await runAudioValidation(process.execPath, ['-e', "process.stdout.write('  passed\\n');process.stderr.write('a diagnostic\\n')"], { cwd: root, directory: root })
  assert.equal(result, 'passed')
  assert.equal(await readFile(join(root, 'stdout.log'), 'utf8'), '  passed\n')
  assert.equal(await readFile(join(root, 'stderr.log'), 'utf8'), 'a diagnostic\n')
  const run = await record(root)
  assert.equal(run.exitCode, 0)
  assert.equal(run.signal, null)
  assert.equal(run.aborted, false)
  assert.equal(run.timedOut, false)
})

for (const first of ['stdout', 'stderr'] as const) {
  test(`abort terminates the owned validation and keeps its pre-abort output (${first} first)`, async t => {
    const root = await directory(t), controller = new AbortController()
    const second = first === 'stdout' ? 'stderr' : 'stdout'
    const markers = { stdout: 'ready\n', stderr: 'before abort\n' }
    // Separate the writes so observing one stream cannot imply the other is ready.
    const script = `process.${first}.write(${JSON.stringify(markers[first])});setTimeout(()=>process.${second}.write(${JSON.stringify(markers[second])}),100);setInterval(()=>{},1000)`
    const result = runAudioValidation(process.execPath, ['-e', script], {
      cwd: root, directory: root, signal: controller.signal,
    })
    const rejected = assert.rejects(result, /validation failed \(aborted\)/)
    await Promise.all([
      waitForOutput(root, 'stdout', markers.stdout),
      waitForOutput(root, 'stderr', markers.stderr),
    ])
    controller.abort('The reason is deliberately not stored in diagnostics')
    await rejected
    const run = await record(root)
    assert.equal(run.aborted, true)
    assert.equal(run.timedOut, false)
    assert.ok(run.signal || run.exitCode !== 0)
    assert.equal(await readFile(join(root, 'stdout.log'), 'utf8'), 'ready\n')
    assert.equal(await readFile(join(root, 'stderr.log'), 'utf8'), 'before abort\n')
  })
}

test('a pre-aborted validation is recorded without starting a child', async t => {
  const root = await directory(t), controller = new AbortController()
  controller.abort()
  await assert.rejects(runAudioValidation(process.execPath, ['-e', "throw Error('must not start')"], {
    cwd: root, directory: root, signal: controller.signal,
  }), /validation failed \(aborted\)/)
  const run = await record(root)
  assert.equal(run.pid, null)
  assert.equal(run.aborted, true)
  assert.equal(await readFile(join(root, 'stdout.log'), 'utf8'), '')
  assert.equal(await readFile(join(root, 'stderr.log'), 'utf8'), '')
})

test('timeout terminates validation and records the timeout separately from abort', async t => {
  const root = await directory(t)
  await assert.rejects(runAudioValidation(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
    cwd: root, directory: root, timeoutMs: 150,
  }), /validation failed \(timed out\)/)
  const run = await record(root)
  assert.equal(run.timedOut, true)
  assert.equal(run.aborted, false)
  assert.ok(run.signal || run.exitCode !== 0)
})

test('a missing validation executable retains a completed diagnostic record', async t => {
  const root = await directory(t)
  await assert.rejects(runAudioValidation(join(root, 'no-such-executable'), [], { cwd: root, directory: root }), /could not start: ENOENT/)
  const run = await record(root)
  assert.equal(run.spawnError.code, 'ENOENT')
  assert.ok(run.endedAt)
})

test('an existing diagnostic directory is never overwritten by another run', async t => {
  const root = await directory(t)
  await runAudioValidation(process.execPath, ['-e', "console.log('first run')"], { cwd: root, directory: root })
  const before = await readFile(join(root, 'run.json'), 'utf8')
  await assert.rejects(runAudioValidation(process.execPath, ['-e', "console.log('second run')"], { cwd: root, directory: root }), /EEXIST/)
  assert.equal(await readFile(join(root, 'run.json'), 'utf8'), before)
  assert.equal(await readFile(join(root, 'stdout.log'), 'utf8'), 'first run\n')
})
