import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectAudio } from './collect-audio.ts'
import { dailyCandidates, type DailyCandidate } from './plan-audio-storage.ts'
import { validateAudio, validateAudioSources, type Clip, type Manifest } from './validate-audio.ts'
import { audioId } from '../src/lib/audioText.ts'
import type { AudioSources } from '../src/lib/audioSources.ts'

type Catalog = ReturnType<typeof collectAudio>
type VerifiedClip = { candidate: DailyCandidate; bytes: number; duration: number; rms: number }
type Index = { version: number; voice: Manifest['voice']; clips: Record<string, number> }

// Preserve verified recordings. A new lesson may be readable while its unique
// sentences await local synthesis and a separately verified Supabase upload.
export function mergeSharedAudio(catalog: Catalog, manifest: Manifest, index: Index, sources: AudioSources,
  verified: Record<string, VerifiedClip>, sourceCommit: string, now: string) {
  validateAudioSources(manifest, sources)
  if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Pin the upstream audio to a full commit SHA')
  const nextManifest = structuredClone(manifest), nextIndex = structuredClone(index), nextSources = structuredClone(sources)
  let added = 0
  for (const entry of catalog.entries) {
    const old = nextManifest.clips[entry.id]
    if (old) {
      if (old.text !== entry.text) throw new Error(`Audio identity collision: ${entry.id}`)
      old.references = entry.references
      continue
    }
    const recording = verified[entry.id]
    if (!recording) continue
    const { candidate, bytes, duration, rms } = recording
    if (candidate.text !== entry.text || audioId(candidate.text) !== entry.id || !Number.isFinite(rms) || rms < .0005) throw new Error(`Unverified shared speech: ${entry.id}`)
    const clip: Clip = { ...entry, bytes, duration, rms, sha256: candidate.sha256 }
    nextManifest.clips[entry.id] = clip
    nextIndex.clips[entry.id] = duration
    nextSources.clips[entry.id] = { provider: 'daily', path: candidate.path, bytes, duration, sha256: candidate.sha256 }
    added++
  }
  const pending = catalog.entries.filter(entry => !nextSources.clips[entry.id])
  const incompleteDates = new Set(pending.flatMap(entry => entry.references.filter(ref => ref.startsWith('lesson/')).map(ref => ref.split('/')[1])))
  nextManifest.lessonDates = catalog.lessonDates.filter(date => !incompleteDates.has(date))
  nextManifest.expectedClips = Object.keys(nextManifest.clips).length
  if (added) {
    nextManifest.generatedAt = now
    nextSources.verifiedAt = now
    nextSources.sharedSource.commit = sourceCommit
    const hosted = Object.entries(nextSources.clips)
    nextSources.summary = {
      total: hosted.length,
      reused: hosted.filter(([, clip]) => clip.provider === 'daily').length,
      uploads: hosted.filter(([, clip]) => clip.provider === 'supabase').length,
      savedBytes: hosted.filter(([, clip]) => clip.provider === 'daily').reduce((sum, [id]) => sum + nextManifest.clips[id].bytes, 0),
      uploadBytes: hosted.filter(([, clip]) => clip.provider === 'supabase').reduce((sum, [, clip]) => sum + clip.bytes, 0),
    }
    for (const record of [nextManifest.clips, nextIndex.clips, nextSources.clips]) {
      const sorted = Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
      for (const key of Object.keys(record)) delete record[key]
      Object.assign(record, Object.fromEntries(sorted))
    }
  }
  validateAudioSources(nextManifest, nextSources)
  return { manifest: nextManifest, index: nextIndex, sources: nextSources, added,
    pending: { version: 1, voice: catalog.voice, requiredClips: catalog.entries.length,
      pendingClips: pending.length, incompleteLessonDates: catalog.lessonDates.filter(date => incompleteDates.has(date)), entries: pending } }
}

export async function verifyCandidate(candidate: DailyCandidate, base: string): Promise<VerifiedClip> {
  const response = await fetch(new URL(candidate.path, base), { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Shared audio HTTP ${response.status}: ${candidate.path}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 512 || createHash('sha256').update(buffer).digest('hex') !== candidate.sha256) throw new Error(`Shared audio SHA-256 mismatch: ${candidate.path}`)
  const work = mkdtempSync(join(tmpdir(), 'n1-sync-audio-'))
  try {
    const file = join(work, 'clip.mp3')
    writeFileSync(file, buffer)
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8' }))
    const pcm = execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-i', file, '-f', 's16le', '-ac', '1', '-ar', '24000', 'pipe:1'], { maxBuffer: 32 * 1024 * 1024 })
    let squares = 0
    for (let offset = 0; offset + 1 < pcm.length; offset += 2) squares += pcm.readInt16LE(offset) ** 2
    const rms = Math.sqrt(squares / Math.max(pcm.length / 2, 1)) / 32768
    if (!Number.isFinite(duration) || duration < .12 || rms < .0005) throw new Error(`Silent or invalid shared audio: ${candidate.path}`)
    return { candidate, bytes: buffer.length, duration: Math.round(duration * 1000) / 1000, rms: Math.round(rms * 1e6) / 1e6 }
  } finally { rmSync(work, { recursive: true, force: true }) }
}

async function main() {
  const args = process.argv.slice(2)
  const option = (name: string) => { const at = args.indexOf(name); return at < 0 ? '' : args[at + 1] ?? '' }
  const repo = option('--daily-repo'), commit = option('--ref'), targetDate = option('--date')
  if (!repo || !/^[a-f0-9]{40}$/.test(commit)) throw new Error('Provide --daily-repo PATH --ref FULL_VERIFIED_AUDIO_COMMIT')
  if (execFileSync('git', ['rev-parse', '--verify', `${commit}^{commit}`], { cwd: repo, encoding: 'utf8' }).trim() !== commit) throw new Error('Upstream audio commit not available')
  const catalog = collectAudio()
  if (targetDate && !catalog.lessonDates.includes(targetDate)) {
    console.log(`waiting_n1_lesson: ${targetDate}; no teaching content or audio metadata changed`)
    return
  }
  validateAudio()
  const read = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))
  const manifest = read('public/audio/manifest.json') as Manifest
  const index = read('src/data/audio-index.json') as Index
  const sources = read('src/data/audio-sources.json') as AudioSources
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, 'public/audio/japanese/'], { cwd: repo, encoding: 'utf8' }).trim().split('\n')
    .filter(path => /^public\/audio\/japanese\/\d{4}-\d{2}-\d{2}\/(?:interview-)?manifest\.json$/.test(path))
  const candidates = new Map<string, DailyCandidate[]>()
  for (const path of paths.sort().reverse()) {
    const daily = JSON.parse(execFileSync('git', ['show', `${commit}:${path}`], { cwd: repo, encoding: 'utf8' }))
    for (const candidate of dailyCandidates(daily, path, manifest.modelVersion)) {
      const id = audioId(candidate.text), list = candidates.get(id) ?? []
      list.push(candidate); candidates.set(id, list)
    }
  }
  const verified: Record<string, VerifiedClip> = {}
  const needed = catalog.entries.filter(entry => !manifest.clips[entry.id] && candidates.has(entry.id))
  for (const entry of needed) {
    let lastError: unknown
    for (const candidate of candidates.get(entry.id)!) {
      if (candidate.text !== entry.text) throw new Error(`Audio hash collision: ${entry.id}`)
      try { verified[entry.id] = await verifyCandidate(candidate, sources.providers.daily); break }
      catch (error) { lastError = error }
    }
    // Do not publish a partial batch or hide a failed upstream recording.
    if (!verified[entry.id]) throw lastError
  }
  const result = mergeSharedAudio(catalog, manifest, index, sources, verified, commit, new Date().toISOString())
  for (const [path, value] of [
    ['public/audio/manifest.json', result.manifest], ['src/data/audio-index.json', result.index],
    ['src/data/audio-sources.json', result.sources], ['src/data/audio-pending.json', result.pending],
  ] as const) {
    const destination = new URL(`../${path}`, import.meta.url), temporary = new URL(`../${path}.partial.json`, import.meta.url)
    const text = JSON.stringify(value, null, 2) + '\n'
    try { if (readFileSync(destination, 'utf8') === text) continue } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    writeFileSync(temporary, text); renameSync(temporary, destination)
  }
  console.log(JSON.stringify({ added: result.added, pending: result.pending.pendingClips, sourceCommit: commit,
    status: result.pending.pendingClips ? 'awaiting_local_audio' : 'audio_complete' }))
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
