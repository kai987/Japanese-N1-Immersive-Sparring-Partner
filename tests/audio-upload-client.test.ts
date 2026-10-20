import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { AUDIO_PUBLIC_BASE, AUDIO_UPLOAD_ENDPOINT, AudioUploadError, ensureAudioUploaded } from '../scripts/lib/audioUpload.ts'

const mp3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xfb, 0x90, 0x64])
const clip = { id: '1234567890abcdef', sha256: createHash('sha256').update(mp3).digest('hex'), bytes: mp3.length }
const path = `morioki-normal/${clip.id}--${clip.sha256}.mp3`
const publicUrl = new URL(path, AUDIO_PUBLIC_BASE).href

test('a paused window prevents new requests and credential access', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(ensureAudioUploaded(clip, '/unused.mp3', {
    signal: controller.signal,
    fetch: async () => { throw new Error('must not request') },
    getToken: async () => { throw new Error('must not request credential') },
  }), (error: unknown) => error instanceof AudioUploadError && error.code === 'INTERRUPTED' && !error.retryable)
})

test('window cancellation interrupts an in-flight request without retrying or uploading', async () => {
  const controller = new AbortController()
  let calls = 0
  const result = ensureAudioUploaded(clip, '/unused.mp3', {
    signal: controller.signal,
    fetch: async (_url, init) => {
      calls++
      return await new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })
        controller.abort()
      })
    },
    getToken: async () => { throw new Error('must not request credential') },
  })
  await assert.rejects(result, (error: unknown) => error instanceof AudioUploadError && error.code === 'INTERRUPTED' && !error.retryable)
  assert.equal(calls, 1)
})

function scriptedFetch(steps: Array<Response | Error | ((url: string, init: RequestInit) => Response)>): { fetch: typeof fetch; calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = []
  return {
    calls,
    fetch: (async (input, init = {}) => {
      const url = String(input)
      calls.push({ url, init })
      assert.equal(init.redirect, 'error')
      assert.ok(init.signal)
      const next = steps.shift()
      assert.ok(next, 'Unexpected additional network request')
      if (next instanceof Error) throw next
      return typeof next === 'function' ? next(url, init) : next
    }) as typeof fetch,
  }
}

async function localAudio(t: test.TestContext, data = mp3): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'n1-upload-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const filename = join(directory, 'audio.mp3')
  await writeFile(filename, data)
  return filename
}

test('an existing matching public object succeeds without a local file or credential', async () => {
  const network = scriptedFetch([new Response(mp3)])
  const result = await ensureAudioUploaded(clip, '/does-not-exist.mp3', {
    fetch: network.fetch,
    getToken: async () => { throw new Error('A credential must not be requested') },
  })
  assert.equal(result.uploaded, false)
  assert.equal(result.verified, true)
  assert.equal(result.url, publicUrl)
  assert.equal(result.path, path)
  assert.equal(network.calls.length, 1)
  assert.equal(new Headers(network.calls[0].init.headers).get('cache-control'), 'no-cache')
  assert.equal(new Headers(network.calls[0].init.headers).has('authorization'), false)
})

test('a remote hash mismatch fails closed without upload or credential access', async () => {
  const network = scriptedFetch([new Response(Buffer.alloc(clip.bytes))])
  await assert.rejects(ensureAudioUploaded(clip, '/unused.mp3', {
    fetch: network.fetch, getToken: async () => { throw new Error('must not access credential') },
  }), (error: unknown) => error instanceof AudioUploadError && error.code === 'REMOTE_MISMATCH' && !error.retryable)
  assert.equal(network.calls.length, 1)
})

test('a lost upload response resumes by verifying public bytes without a repeated POST', async t => {
  const filename = await localAudio(t)
  const sleeps: number[] = []
  let credentials = 0
  const network = scriptedFetch([
    new Response(null, { status: 404 }),
    (_url, init) => {
      assert.equal(init.method, 'POST')
      assert.deepEqual(Buffer.from(init.body as ArrayBuffer), mp3)
      throw new Error('Lost response with secret server body')
    },
    new Response(mp3),
  ])
  const result = await ensureAudioUploaded(clip, filename, {
    fetch: network.fetch, getToken: async () => { credentials++; return 'private-token' }, sleep: async ms => { sleeps.push(ms) },
  })
  assert.equal(result.uploaded, true)
  assert.equal(result.attempts, 2)
  assert.equal(credentials, 1)
  assert.deepEqual(sleeps, [500])
  assert.deepEqual(network.calls.map(call => call.url), [publicUrl, AUDIO_UPLOAD_ENDPOINT, publicUrl])
  assert.deepEqual(network.calls[1].init.headers, { Authorization: 'Bearer private-token', 'Content-Type': 'audio/mpeg', 'x-n1-object-path': path })
})

test('authentication failures stop immediately and never expose credential or server body', async t => {
  const filename = await localAudio(t)
  const network = scriptedFetch([new Response(null, { status: 404 }), new Response('private-token secret body', { status: 401 })])
  await assert.rejects(ensureAudioUploaded(clip, filename, {
    fetch: network.fetch, getToken: async () => 'private-token', sleep: async () => { assert.fail('Must not retry HTTP 401') },
  }), (error: unknown) => error instanceof AudioUploadError && error.status === 401 && !error.retryable && !/private-token|secret body/.test(String(error)))
  assert.equal(network.calls.length, 2)
})

test('transient public requests retry with bounded backoff before uploading', async t => {
  const filename = await localAudio(t)
  const sleeps: number[] = []
  const network = scriptedFetch([
    new Response('upstream unavailable', { status: 503 }),
    new Response('rate limited', { status: 429 }),
    new Response(null, { status: 404 }),
    new Response('{}', { status: 201 }),
    new Response(mp3),
  ])
  const result = await ensureAudioUploaded(clip, filename, {
    fetch: network.fetch, getToken: async () => 'private-token', sleep: async ms => { sleeps.push(ms) },
  })
  assert.equal(result.attempts, 3)
  assert.deepEqual(sleeps, [500, 1000])
  assert.equal(network.calls.filter(call => call.init.method === 'POST').length, 1)
})

test('exhausted network retries return a typed retryable error', async () => {
  const network = scriptedFetch([new Error('network details'), new Error('network details'), new Error('network details')])
  const sleeps: number[] = []
  await assert.rejects(ensureAudioUploaded(clip, '/unused.mp3', {
    fetch: network.fetch, getToken: async () => 'unused', sleep: async ms => { sleeps.push(ms) },
  }), (error: unknown) => error instanceof AudioUploadError && error.code === 'NETWORK_ERROR' && error.retryable && !String(error).includes('network details'))
  assert.equal(network.calls.length, 3)
  assert.deepEqual(sleeps, [500, 1000])
})

test('incorrect local bytes or SHA-256 never reach the upload endpoint', async t => {
  const filename = await localAudio(t, Buffer.from('incorrect audio'))
  const network = scriptedFetch([new Response(null, { status: 404 })])
  await assert.rejects(ensureAudioUploaded(clip, filename, {
    fetch: network.fetch, getToken: async () => { assert.fail('Local validation must precede credential access') },
  }), (error: unknown) => error instanceof AudioUploadError && error.code === 'LOCAL_MISMATCH')
  assert.equal(network.calls.length, 1)
})

test('only an explicit Storage not_found response permits upload after HTTP 400', async t => {
  const filename = await localAudio(t)
  const network = scriptedFetch([
    Response.json({ statusCode: '404', error: 'not_found', message: 'Object not found' }, { status: 400 }),
    new Response('{}', { status: 200 }),
    new Response(mp3),
  ])
  assert.equal((await ensureAudioUploaded(clip, filename, { fetch: network.fetch, getToken: async () => 'private-token' })).verified, true)
  const rejected = scriptedFetch([Response.json({ message: 'not found', error: 'permission_denied' }, { status: 400 })])
  await assert.rejects(ensureAudioUploaded(clip, filename, { fetch: rejected.fetch, getToken: async () => 'unused' }),
    (error: unknown) => error instanceof AudioUploadError && error.status === 400 && !error.retryable)
  assert.equal(rejected.calls.length, 1)
})

test('unsafe identifiers, oversize objects and non-MP3 bytes fail before upload', async t => {
  for (const invalid of [{ ...clip, id: '../private' }, { ...clip, sha256: 'unknown' }, { ...clip, bytes: 1024 * 1024 + 1 }]) {
    await assert.rejects(ensureAudioUploaded(invalid, '/unused.mp3', { getToken: async () => 'unused' }),
      (error: unknown) => error instanceof AudioUploadError && error.code === 'INVALID_CLIP')
  }
  const invalidMp3 = Buffer.alloc(mp3.length)
  const filename = await localAudio(t, invalidMp3)
  const network = scriptedFetch([new Response(null, { status: 404 })])
  await assert.rejects(ensureAudioUploaded({ ...clip, sha256: createHash('sha256').update(invalidMp3).digest('hex') }, filename, {
    fetch: network.fetch, getToken: async () => 'unused',
  }), (error: unknown) => error instanceof AudioUploadError && error.code === 'LOCAL_MISMATCH')
  assert.equal(network.calls.length, 1)
})
