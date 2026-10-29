import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { validateAudioSources, type Manifest } from '../validate-audio.ts'
import type { AudioSources } from '../../src/lib/audioSources.ts'
import { prepareManualAudioSnapshot } from './audioSnapshot.ts'
import type { collectAudio } from '../collect-audio.ts'

type Destination = string | URL

/** Both complete files are staged first; restore the originals if a rename fails. */
export function saveManualAudioPublication(manifestPath: Destination, sourcesPath: Destination, manifest: Manifest, sources: AudioSources,
  options: { rename?: typeof renameSync; pending?: { path: Destination; value: unknown }; expected?: { manifest: Uint8Array; sources: Uint8Array; pending?: Uint8Array } } = {}) {
  const rename = options.rename ?? renameSync
  const files: Array<readonly [Destination, unknown]> = [[manifestPath, manifest], [sourcesPath, sources]]
  if (options.pending) files.push([options.pending.path, options.pending.value])
  const prior = files.map(([path]) => readFileSync(path))
  const expected = [options.expected?.manifest, options.expected?.sources, options.expected?.pending]
  for (let index = 0; index < files.length; index++) if (expected[index] && !prior[index].equals(Buffer.from(expected[index]!))) {
    throw new Error('Audio metadata changed during verification; retain the newer files and retry')
  }
  const next = files.map(([, value]) => Buffer.from(JSON.stringify(value, null, 2) + '\n'))
  const transaction = randomUUID()
  const beside = (path: Destination, suffix: string) => typeof path === 'string' ? `${path}.${suffix}-${transaction}` : new URL(`${path.href}.${suffix}-${transaction}`)
  const temporary = files.map(([path]) => beside(path, 'partial'))
  const recovery = files.map(([path]) => beside(path, 'rollback'))
  let replaced = 0, retainRecovery = false
  try {
    next.forEach((bytes, index) => writeFileSync(temporary[index], bytes))
    prior.forEach((bytes, index) => writeFileSync(recovery[index], bytes, { flag: 'wx' }))
    for (let index = 0; index < files.length; index++) {
      if (!readFileSync(files[index][0]).equals(prior[index])) throw new Error('Audio metadata changed during publication; retain the newer files and retry')
      rename(temporary[index], files[index][0]); replaced++
    }
    if (files.some(([path], index) => !readFileSync(path).equals(next[index]))) throw new Error('Audio metadata changed during publication; preserve recovery copies')
  } catch (error) {
    const failures: unknown[] = []
    for (let index = replaced - 1; index >= 0; index--) {
      try {
        if (!readFileSync(files[index][0]).equals(next[index])) throw new Error('A newer file replaced this transaction; retain it and the original recovery copy')
        rename(recovery[index], files[index][0])
      }
      catch (failure) { failures.push(failure) }
    }
    if (failures.length) {
      retainRecovery = true
      throw new AggregateError([error, ...failures], 'Audio metadata replacement failed; original recovery copies were retained beside the metadata files')
    }
    throw error
  } finally {
    for (const path of temporary) rmSync(path, { force: true })
    if (!retainRecovery) for (const path of recovery) rmSync(path, { force: true })
  }
}

/** Local candidates cannot extend published reference proofs until every GET matches. */
export async function verifyManualAudioPublication(manifest: Manifest, sources: AudioSources, options: {
  publish: boolean
  fetch?: typeof fetch
  sleep?: (milliseconds: number) => Promise<void>
  now?: string
  progress?: (verified: number, total: number) => void
  catalog?: ReturnType<typeof collectAudio>
}) {
  const nextManifest = options.publish ? prepareManualAudioSnapshot(manifest, options.catalog) : structuredClone(manifest)
  const nextSources = structuredClone(sources)
  validateAudioSources(nextManifest, nextSources, !options.publish)
  const queue = Object.entries(nextSources.clips), total = queue.length
  const failed: Array<{ id: string; error: string }> = []
  const fetcher = options.fetch ?? globalThis.fetch
  const sleep = options.sleep ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)))
  let verified = 0, bytes = 0
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const [id, recording] = queue.shift()!
      const url = new URL(recording.path, nextSources.providers[recording.provider]).href
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetcher(url, { signal: AbortSignal.timeout(30000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = Buffer.from(await response.arrayBuffer())
          if (data.length !== recording.bytes || createHash('sha256').update(data).digest('hex') !== recording.sha256) throw new Error('Remote bytes/SHA-256 differ from the verified recording')
          verified++; bytes += data.length
          options.progress?.(verified, total)
          break
        } catch (error) {
          if (attempt === 3) failed.push({ id, error: String(error) })
          else await sleep(attempt * 500)
        }
      }
    }
  }))
  if (failed.length) throw new Error(`${failed.length} remote recordings failed verification: ${JSON.stringify(failed.slice(0, 10))}`)
  if (options.publish) {
    const now = options.now ?? new Date().toISOString()
    if (!Number.isFinite(Date.parse(now))) throw new Error('Invalid audio verification time')
    nextSources.complete = true
    nextSources.verifiedAt = now
  }
  const missing = options.catalog?.entries.filter(entry => !nextSources.clips[entry.id])
  const incompleteDates = new Set(missing?.flatMap(entry => entry.references.filter(reference => reference.startsWith('lesson/')).map(reference => reference.split('/')[1])))
  const pending = options.catalog && missing ? { version: 1, voice: structuredClone(options.catalog.voice), requiredClips: options.catalog.entries.length,
    pendingClips: missing.length, incompleteLessonDates: options.catalog.lessonDates.filter(date => incompleteDates.has(date)), entries: structuredClone(missing) } : undefined
  return { manifest: nextManifest, sources: nextSources, pending, verified, bytes }
}
