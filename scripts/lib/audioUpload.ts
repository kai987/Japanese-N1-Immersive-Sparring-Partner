import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

export const AUDIO_UPLOAD_ENDPOINT = 'https://flpmblfscgcbrprwwckz.supabase.co/functions/v1/n1-audio-upload'
export const AUDIO_PUBLIC_BASE = 'https://flpmblfscgcbrprwwckz.supabase.co/storage/v1/object/public/n1-audio/'
const MAX_AUDIO_BYTES = 1024 * 1024

export interface UploadClip {
  id: string
  sha256: string
  bytes: number
}

export interface AudioUploadOptions {
  getToken: () => Promise<string>
  fetch?: typeof globalThis.fetch
  sleep?: (milliseconds: number) => Promise<void>
  maxAttempts?: number
  timeoutMs?: number
  signal?: AbortSignal
}

export interface AudioUploadResult extends UploadClip {
  path: string
  url: string
  uploaded: boolean
  verified: true
  attempts: number
}

/** Safe to record in a checkpoint: messages never include credentials or response bodies. */
export class AudioUploadError extends Error {
  readonly retryable: boolean
  readonly status: number | undefined
  readonly code: string

  constructor(code: string, message: string, retryable = false, status?: number) {
    super(message)
    this.name = 'AudioUploadError'
    this.code = code
    this.retryable = retryable
    this.status = status
  }
}

function httpError(status: number): AudioUploadError {
  return new AudioUploadError('HTTP_ERROR', `Audio service returned HTTP ${status}`, status === 429 || status >= 500, status)
}

function hasMp3Magic(data: Uint8Array): boolean {
  if (data.length < 4) return false
  return (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33)
    || (data[0] === 0xff && (data[1] & 0xe0) === 0xe0 && (data[1] & 0x06) !== 0)
}

function digest(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Insert one immutable N1 object, then verify its complete public bytes.
 * Public verification comes first on every attempt, including retries after a lost response.
 */
export async function ensureAudioUploaded(clip: UploadClip, mp3Path: string, options: AudioUploadOptions): Promise<AudioUploadResult> {
  if (!/^[a-f0-9]{16}$/.test(clip.id) || !/^[a-f0-9]{64}$/.test(clip.sha256)
    || !Number.isSafeInteger(clip.bytes) || clip.bytes < 4 || clip.bytes > MAX_AUDIO_BYTES) {
    throw new AudioUploadError('INVALID_CLIP', 'Audio metadata does not describe an allowed immutable MP3')
  }
  const maxAttempts = options.maxAttempts ?? 3
  const timeoutMs = options.timeoutMs ?? 30_000
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10
    || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new AudioUploadError('INVALID_OPTIONS', 'Audio retry limits are invalid')
  }
  const fetcher = options.fetch ?? globalThis.fetch
  const sleep = options.sleep ?? (milliseconds => delay(milliseconds, undefined, { signal: options.signal }))
  const checkInterrupted = () => {
    if (options.signal?.aborted) throw new AudioUploadError('INTERRUPTED', 'Audio upload paused; verified progress retained')
  }
  const path = `morioki-normal/${clip.id}--${clip.sha256}.mp3`
  const url = new URL(path, AUDIO_PUBLIC_BASE).href
  let localBody: ArrayBuffer | undefined
  let uploaded = false

  async function request(target: string, init: RequestInit): Promise<Response> {
    checkInterrupted()
    try {
      const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
      return await fetcher(target, { ...init, redirect: 'error', signal })
    } catch {
      checkInterrupted()
      throw new AudioUploadError('NETWORK_ERROR', 'Audio service request failed or timed out', true)
    }
  }

  async function isPublicObjectVerified(): Promise<boolean> {
    const response = await request(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } })
    if (response.status === 404) {
      await response.body?.cancel()
      return false
    }
    // Supabase Storage also represents an absent object as HTTP 400 with this explicit code.
    if (response.status === 400) {
      let missing = false
      try {
        const body: unknown = await response.json()
        missing = !!body && typeof body === 'object'
          && (('error' in body && body.error === 'not_found') || ('code' in body && body.code === 'not_found'))
      } catch { /* A malformed or unrelated 400 must fail closed. */ }
      if (missing) return false
      throw httpError(400)
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw httpError(response.status)
    }
    const reader = response.body?.getReader()
    if (!reader) throw new AudioUploadError('REMOTE_MISMATCH', 'Published audio has no matching byte content')
    const hash = createHash('sha256')
    let bytes = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > clip.bytes) {
          await reader.cancel()
          throw new AudioUploadError('REMOTE_MISMATCH', 'Published audio differs from the expected bytes or SHA-256')
        }
        hash.update(value)
      }
    } catch (error) {
      checkInterrupted()
      if (error instanceof AudioUploadError) throw error
      throw new AudioUploadError('NETWORK_ERROR', 'Published audio could not be read completely', true)
    } finally {
      reader.releaseLock()
    }
    if (bytes !== clip.bytes || hash.digest('hex') !== clip.sha256) {
      throw new AudioUploadError('REMOTE_MISMATCH', 'Published audio differs from the expected bytes or SHA-256')
    }
    return true
  }

  async function validatedBody(): Promise<ArrayBuffer> {
    if (localBody) return localBody
    let data: Uint8Array
    try {
      data = await readFile(mp3Path)
    } catch {
      throw new AudioUploadError('LOCAL_FILE_UNAVAILABLE', 'The unpublished audio file is unavailable locally')
    }
    if (data.byteLength !== clip.bytes || data.byteLength > MAX_AUDIO_BYTES || digest(data) !== clip.sha256 || !hasMp3Magic(data)) {
      throw new AudioUploadError('LOCAL_MISMATCH', 'Local audio does not match its MP3 metadata, bytes or SHA-256')
    }
    localBody = Uint8Array.from(data).buffer
    return localBody
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (await isPublicObjectVerified()) return { ...clip, path, url, uploaded, verified: true, attempts: attempt }
      const body = await validatedBody()
      let token: string
      try {
        token = await options.getToken()
      } catch {
        throw new AudioUploadError('CREDENTIAL_UNAVAILABLE', 'The audio upload credential is unavailable')
      }
      if (!token || /[\r\n]/.test(token)) throw new AudioUploadError('CREDENTIAL_UNAVAILABLE', 'The audio upload credential is invalid')
      uploaded = true
      const response = await request(AUDIO_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'audio/mpeg', 'x-n1-object-path': path },
        body,
      })
      await response.body?.cancel()
      if (!response.ok && response.status !== 409) throw httpError(response.status)
      if (await isPublicObjectVerified()) return { ...clip, path, url, uploaded, verified: true, attempts: attempt }
      if (response.status === 409) throw httpError(409)
      throw new AudioUploadError('PUBLIC_OBJECT_PENDING', 'Uploaded audio is not yet publicly available', true)
    } catch (error) {
      checkInterrupted()
      if (!(error instanceof AudioUploadError)) throw new AudioUploadError('UPLOAD_FAILED', 'Audio upload could not be completed')
      if (!error.retryable || attempt === maxAttempts) throw error
      await sleep(Math.min(500 * 2 ** (attempt - 1), 5_000))
    }
  }
  throw new AudioUploadError('UPLOAD_FAILED', 'Audio upload could not be completed')
}
