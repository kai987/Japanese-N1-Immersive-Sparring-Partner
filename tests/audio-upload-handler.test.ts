import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { createUploadHandler } from '../supabase/functions/n1-audio-upload/handler.ts'

const token = 'test-local-upload-token-with-at-least-32-characters'
const tokenHash = createHash('sha256').update(token).digest('hex')
const bytes = Uint8Array.from([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0, 0xff, 0xfb, 0x90, 0, 0, 0])
const hash = createHash('sha256').update(bytes).digest('hex')
const path = `morioki-normal/0123456789abcdef--${hash}.mp3`
const base = 'https://test-project.supabase.co'
const fakeSecret = 'sb_secret_test-server-only'

function request(options: { method?: string; path?: string; type?: string; auth?: string | null; bytes?: Uint8Array<ArrayBuffer>; headers?: Record<string, string> } = {}) {
  const method = options.method ?? 'POST'
  const headers: Record<string, string> = {
    'x-n1-object-path': options.path ?? path,
    'content-type': options.type ?? 'audio/mpeg',
    ...options.headers,
  }
  if (options.auth !== null) headers.authorization = options.auth ?? `Bearer ${token}`
  return new Request('https://upload.example/functions/v1/n1-audio-upload', {
    method, headers, body: method === 'GET' || method === 'HEAD' ? undefined : options.bytes ?? bytes,
  })
}

function fixture(responses: Array<Response | Error> = [], environment: Record<string, string | undefined> = {
  SUPABASE_URL: base,
  SUPABASE_SECRET_KEYS: JSON.stringify({ default: fakeSecret }),
  SUPABASE_SERVICE_ROLE_KEY: 'legacy-should-not-be-used',
}, acceptedTokenHashes = [tokenHash]) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const envReads: string[] = []
  const handler = createUploadHandler({
    acceptedTokenHashes,
    env: name => { envReads.push(name); return environment[name] },
    fetch: async (input, init = {}) => {
      calls.push({ url: String(input), init })
      const response = responses.shift()
      assert.ok(response, 'unexpected Storage request')
      if (response instanceof Error) throw response
      return response
    },
  })
  return { handler, calls, envReads }
}

test('audio upload rejects absent, incorrect, malformed, or unconfigured authentication before accessing Storage', async () => {
  for (const auth of [null, 'Bearer wrong-token-with-at-least-32-characters', 'Basic test', 'Bearer short']) {
    const { handler, calls, envReads } = fixture()
    assert.equal((await handler(request({ auth }))).status, 401)
    assert.equal(calls.length, 0)
    assert.equal(envReads.length, 0)
  }
  for (const accepted of [[], ['not-a-sha256-hash']]) {
    const { handler, calls } = fixture([], {}, accepted)
    assert.equal((await handler(request())).status, 503)
    assert.equal(calls.length, 0)
  }
})

test('audio upload exposes only POST and exact content-addressed morioki paths in the fixed N1 bucket', async () => {
  for (const method of ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const { handler, calls } = fixture()
    const response = await handler(request({ method }))
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('allow'), 'POST')
    assert.equal(calls.length, 0)
  }
  for (const invalidPath of [
    `interview-audio/${path}`, `n1-audio/${path}`, `morioki-normal/../${path}`,
    `morioki-normal/%2e%2e/${path}`, `https://attacker.example/${path}`, `${path}?bucket=interview-audio`,
    `${path}/`, path.toUpperCase(), `morioki-normal/0123456789abcde--${hash}.mp3`,
  ]) {
    const { handler, calls } = fixture()
    assert.equal((await handler(request({ path: invalidPath }))).status, 400)
    assert.equal(calls.length, 0)
  }
})

test('audio upload rejects wrong MIME, non-MP3 bytes, and a path hash that disagrees with actual bytes', async () => {
  for (const type of ['audio/wav', 'application/octet-stream', 'audio/mpeg; charset=utf-8']) {
    const { handler, calls } = fixture()
    assert.equal((await handler(request({ type }))).status, 415)
    assert.equal(calls.length, 0)
  }
  const invalidBytes = new TextEncoder().encode('<html>not an mp3</html>')
  const wrongMagic = fixture()
  assert.equal((await wrongMagic.handler(request({ bytes: invalidBytes }))).status, 415)
  assert.equal(wrongMagic.calls.length, 0)
  const wrongHash = fixture()
  assert.equal((await wrongHash.handler(request({ path: path.replace(hash, 'f'.repeat(64)) }))).status, 422)
  assert.equal(wrongHash.calls.length, 0)
})

test('audio upload caps the body while streaming even when Content-Length is absent or lies', async () => {
  const declared = fixture()
  assert.equal((await declared.handler(request({ headers: { 'content-length': '1048577' } }))).status, 413)
  assert.equal(declared.calls.length, 0)
  for (const contentLength of [undefined, '1']) {
    let canceled = false
    const { handler, calls } = fixture()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(600_000))
        controller.enqueue(new Uint8Array(600_000))
      },
      cancel() { canceled = true },
    })
    const headers: Record<string, string> = { authorization: `Bearer ${token}`, 'x-n1-object-path': path, 'content-type': 'audio/mpeg' }
    if (contentLength) headers['content-length'] = contentLength
    const streamedRequest = new Request('https://upload.example/', { method: 'POST', body: stream, headers, duplex: 'half' } as RequestInit)
    assert.equal((await handler(streamedRequest)).status, 413)
    assert.equal(canceled, true)
    assert.equal(calls.length, 0)
  }
})

test('new audio uploads use the server secret only at a fixed Storage POST endpoint and never overwrite', async () => {
  const { handler, calls } = fixture([new Response(null, { status: 404 }), new Response('{}', { status: 200 })])
  const response = await handler(request())
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { path, sha256: hash, bytes: bytes.length, state: 'uploaded' })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, `${base}/storage/v1/object/public/n1-audio/${path}`)
  assert.equal(calls[0].init.method, 'GET')
  assert.equal(new Headers(calls[0].init.headers).has('apikey'), false)
  assert.equal(calls[1].url, `${base}/storage/v1/object/n1-audio/${path}`)
  assert.equal(calls[1].init.method, 'POST')
  const uploadHeaders = new Headers(calls[1].init.headers)
  assert.equal(uploadHeaders.get('apikey'), fakeSecret)
  assert.equal(uploadHeaders.has('authorization'), false)
  assert.equal(uploadHeaders.get('x-upsert'), 'false')
  assert.equal(uploadHeaders.get('content-type'), 'audio/mpeg')
  assert.equal(uploadHeaders.get('content-length'), String(bytes.length))
  assert.deepEqual(calls[1].init.body, bytes)
  for (const call of calls) {
    assert.equal(call.init.redirect, 'error')
    assert.ok(call.init.signal)
    assert.doesNotMatch(call.url, /interview-audio/)
  }
})

test('identical existing audio succeeds idempotently without accessing private Storage or writing again', async () => {
  const { handler, calls } = fixture([new Response(bytes)])
  const response = await handler(request({ headers: { 'x-bucket': 'interview-audio', 'x-upsert': 'true' } }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { path, sha256: hash, bytes: bytes.length, state: 'exists' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].init.method, 'GET')
  assert.match(calls[0].url, /\/object\/public\/n1-audio\/morioki-normal\//)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('existing mismatched or oversized bytes cause a conflict and cannot be overwritten', async () => {
  for (const existing of [new Uint8Array(bytes.length), new Uint8Array(1_048_577)]) {
    const { handler, calls } = fixture([new Response(existing)])
    const response = await handler(request())
    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), { error: 'existing_audio_mismatch' })
    assert.equal(calls.length, 1)
  }
})

test('concurrent duplicate uploads are accepted only after verifying the winning immutable object', async () => {
  for (const status of [400, 409]) {
    const { handler, calls } = fixture([new Response(null, { status: 404 }), new Response('duplicate', { status }), new Response(bytes)])
    const response = await handler(request())
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { path, sha256: hash, bytes: bytes.length, state: 'exists' })
    assert.deepEqual(calls.map(call => call.init.method), ['GET', 'POST', 'GET'])
  }
  const mismatch = fixture([new Response(null, { status: 404 }), new Response('duplicate', { status: 409 }), new Response(new Uint8Array(bytes.length))])
  assert.equal((await mismatch.handler(request())).status, 409)
  assert.equal(mismatch.calls.length, 3)
})

test('legacy not-found responses and legacy server credentials remain supported without exposing their values', async () => {
  const legacyKey = 'server-only-legacy-key'
  const { handler, calls } = fixture([
    new Response(JSON.stringify({ statusCode: '404', error: 'not_found', message: 'Object not found' }), { status: 400 }),
    new Response('{}', { status: 200 }),
  ], { SUPABASE_URL: base, SUPABASE_SERVICE_ROLE_KEY: legacyKey })
  const response = await handler(request())
  assert.equal(response.status, 201)
  const uploadHeaders = new Headers(calls[1].init.headers)
  assert.equal(uploadHeaders.get('apikey'), legacyKey)
  assert.equal(uploadHeaders.get('authorization'), `Bearer ${legacyKey}`)
  const body = await response.text()
  assert.doesNotMatch(body, /server-only|Bearer|sb_secret/)
})

test('Storage errors and exceptions fail closed with sanitized responses and no unrelated operations', async () => {
  for (const upstream of [new Response('private diagnostic with server-key', { status: 403 }), new Error('sensitive exception with server-key')]) {
    const { handler, calls } = fixture([upstream])
    const response = await handler(request())
    assert.equal(response.status, 502)
    assert.doesNotMatch(await response.text(), /private|server-key|diagnostic|exception/)
    assert.equal(calls.length, 1)
  }
  for (const env of [{ SUPABASE_URL: base }, { SUPABASE_URL: 'https://user:password@example.com/' }, { SUPABASE_URL: base, SUPABASE_SECRET_KEYS: '{broken' }]) {
    const { handler, calls } = fixture([], env)
    assert.equal((await handler(request())).status, 503)
    assert.equal(calls.length, 0)
  }
})
