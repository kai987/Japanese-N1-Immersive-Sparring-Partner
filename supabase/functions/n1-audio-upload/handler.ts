const BUCKET = 'n1-audio'
const MAX_BYTES = 1_048_576
const OBJECT_PATH = /^morioki-normal\/([a-f0-9]{16})--([a-f0-9]{64})\.mp3$/
const HASH = /^[a-f0-9]{64}$/

export type UploadDependencies = {
  env: (name: string) => string | undefined
  fetch: typeof globalThis.fetch
  acceptedTokenHashes: readonly string[]
}

class UploadError extends Error {
  status: number

  constructor(status: number, code: string) {
    super(code)
    this.status = status
  }
}

function json(status: number, value: Record<string, string | number>, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  })
}

async function sha256(bytes: Uint8Array<ArrayBuffer>) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function equalHash(left: string, right: string) {
  let difference = 0
  for (let index = 0; index < 64; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return Number(difference === 0)
}

async function authorize(request: Request, accepted: readonly string[]) {
  if (!accepted.length || accepted.some(hash => !HASH.test(hash))) throw new UploadError(503, 'upload_not_configured')
  const token = /^Bearer ([\x21-\x7e]{32,256})$/.exec(request.headers.get('authorization') ?? '')?.[1]
  if (!token) throw new UploadError(401, 'unauthorized')
  const actual = await sha256(new TextEncoder().encode(token))
  let matches = 0
  for (const expected of accepted) matches |= equalHash(actual, expected)
  if (!matches) throw new UploadError(401, 'unauthorized')
}

async function boundedBytes(body: ReadableStream<Uint8Array> | null, limit: number) {
  if (!body) return new Uint8Array(0)
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      length += next.value.byteLength
      if (length > limit) {
        await reader.cancel().catch(() => undefined)
        throw new UploadError(413, 'audio_too_large')
      }
      chunks.push(next.value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

function hasMp3Magic(bytes: Uint8Array) {
  if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true
  return bytes.length >= 4 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0
    && (bytes[1] & 0x18) !== 0x08 && (bytes[1] & 0x06) === 0x02
    && (bytes[2] >>> 4) > 0 && (bytes[2] >>> 4) < 15 && (bytes[2] & 0x0c) !== 0x0c
}

function storageConfiguration(env: UploadDependencies['env']): { base: string; headers: Record<string, string> } {
  const source = env('SUPABASE_URL')
  if (!source) throw new UploadError(503, 'upload_not_configured')
  let url: URL
  try {
    url = new URL(source)
  } catch {
    throw new UploadError(503, 'upload_not_configured')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new UploadError(503, 'upload_not_configured')
  }
  let secret: unknown
  const secretKeys = env('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    try {
      secret = JSON.parse(secretKeys).default
    } catch {
      throw new UploadError(503, 'upload_not_configured')
    }
  }
  if (typeof secret === 'string' && secret.startsWith('sb_secret_')) {
    return { base: url.origin, headers: { apikey: secret } }
  }
  const legacy = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!legacy) throw new UploadError(503, 'upload_not_configured')
  return { base: url.origin, headers: { apikey: legacy, authorization: `Bearer ${legacy}` } }
}

async function isMissing(response: Response) {
  if (response.status === 404) {
    await response.body?.cancel().catch(() => undefined)
    return true
  }
  if (response.status !== 400) return false
  try {
    const bytes = await boundedBytes(response.body, 8192)
    const error = JSON.parse(new TextDecoder().decode(bytes))
    return error.code === 'NoSuchKey' || (String(error.statusCode ?? error.httpStatusCode) === '404' && error.error === 'not_found')
  } catch {
    return false
  }
}

export function createUploadHandler(deps: UploadDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, { allow: 'POST' })
    try {
      await authorize(request, deps.acceptedTokenHashes)
      const path = request.headers.get('x-n1-object-path') ?? ''
      const matchedPath = OBJECT_PATH.exec(path)
      if (!matchedPath) throw new UploadError(400, 'invalid_audio_path')
      if (request.headers.get('content-type')?.trim().toLowerCase() !== 'audio/mpeg') throw new UploadError(415, 'invalid_audio_type')
      const declared = request.headers.get('content-length')
      if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) throw new UploadError(400, 'invalid_audio_length')
      if (declared !== null && Number(declared) > MAX_BYTES) throw new UploadError(413, 'audio_too_large')
      const bytes = await boundedBytes(request.body, MAX_BYTES)
      if (!hasMp3Magic(bytes)) throw new UploadError(415, 'invalid_mp3')
      const expectedHash = matchedPath[2]
      if (!equalHash(await sha256(bytes), expectedHash)) throw new UploadError(422, 'audio_hash_mismatch')
      const storage = storageConfiguration(deps.env)
      const publicUrl = `${storage.base}/storage/v1/object/public/${BUCKET}/${path}`
      const getExisting = async () => {
        const response = await deps.fetch(publicUrl, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(30_000), headers: { 'cache-control': 'no-cache' } })
        if (await isMissing(response)) return false
        if (!response.ok) {
          await response.body?.cancel().catch(() => undefined)
          throw new UploadError(502, 'storage_unavailable')
        }
        let existing: Uint8Array<ArrayBuffer>
        try {
          existing = await boundedBytes(response.body, MAX_BYTES)
        } catch {
          throw new UploadError(409, 'existing_audio_mismatch')
        }
        if (existing.length !== bytes.length || !equalHash(await sha256(existing), expectedHash)) {
          throw new UploadError(409, 'existing_audio_mismatch')
        }
        return true
      }
      const result = { path, sha256: expectedHash, bytes: bytes.length }
      if (await getExisting()) return json(200, { ...result, state: 'exists' })
      const uploaded = await deps.fetch(`${storage.base}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
        headers: { ...storage.headers, 'content-type': 'audio/mpeg', 'content-length': String(bytes.length), 'cache-control': '31536000', 'x-upsert': 'false' },
        body: bytes,
      })
      await uploaded.body?.cancel().catch(() => undefined)
      if (uploaded.ok) return json(201, { ...result, state: 'uploaded' })
      // A timed-out caller or concurrent retry can have finished the immutable upload first.
      if (uploaded.status === 400 || uploaded.status === 409) {
        if (await getExisting()) return json(200, { ...result, state: 'exists' })
      }
      throw new UploadError(502, 'storage_unavailable')
    } catch (error) {
      if (error instanceof UploadError) return json(error.status, { error: error.message })
      return json(502, { error: 'upload_failed' })
    }
  }
}
