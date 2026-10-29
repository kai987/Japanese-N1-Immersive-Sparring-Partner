import type { collectAudio } from '../collect-audio.ts'
import { validateAudioSources, type Clip, type Manifest } from '../validate-audio.ts'
import type { AudioSources } from '../../src/lib/audioSources.ts'
import { audioId } from '../../src/lib/audioText.ts'
import { advanceNonLessonSnapshot } from './audioSnapshot.ts'

type Catalog = ReturnType<typeof collectAudio>
export type AudioIndex = { version: number; voice: Manifest['voice']; clips: Record<string, number> }
export type VerifiedUpload = { path: string; sha256: string; bytes: number; verified: true }

function sameVoice(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function validClip(id: string, clip: Clip) {
  return /^[a-f0-9]{16}$/.test(id) && clip.id === id && audioId(clip.text) === id
    && !!clip.label && Array.isArray(clip.references) && clip.references.length > 0
    && Number.isFinite(clip.duration) && clip.duration >= .12
    && Number.isFinite(clip.rms) && clip.rms >= .0005 && clip.rms <= 1
    && Number.isSafeInteger(clip.bytes) && clip.bytes >= 512
    && /^[a-f0-9]{64}$/.test(clip.sha256)
}

/** Publish a complete verified upload batch without rewriting hosted history. */
export function mergeUploadedRecordings(catalog: Catalog, manifest: Manifest, index: AudioIndex,
  sources: AudioSources, candidateManifest: Manifest, verifiedUploads: Record<string, VerifiedUpload>, now: string) {
  validateAudioSources(manifest, sources)
  if (catalog.version !== 1 || manifest.version !== 1 || index.version !== 1 || candidateManifest.version !== 1
    || !sameVoice(catalog.voice, manifest.voice) || !sameVoice(index.voice, manifest.voice)
    || !sameVoice(candidateManifest.voice, manifest.voice) || candidateManifest.modelVersion !== manifest.modelVersion) {
    throw new Error('Audio worker voice/model differs from the published recordings')
  }
  const published = Object.entries(manifest.clips)
  if (!manifest.complete || manifest.expectedClips !== published.length || Object.keys(index.clips).length !== published.length) {
    throw new Error('The published audio snapshot or client index is incomplete')
  }
  for (const [id, clip] of published) {
    if (!validClip(id, clip) || index.clips[id] !== clip.duration) throw new Error(`Invalid published audio metadata: ${id}`)
  }
  const nextManifest = structuredClone(manifest), nextIndex = structuredClone(index), nextSources = structuredClone(sources)
  const ids = new Set<string>()
  let added = 0
  for (const entry of catalog.entries) {
    if (ids.has(entry.id) || audioId(entry.text) !== entry.id) throw new Error(`Invalid current audio identity: ${entry.id}`)
    ids.add(entry.id)
    const existing = manifest.clips[entry.id]
    if (existing) {
      if (existing.text !== entry.text) throw new Error(`Audio identity collision: ${entry.id}`)
      continue
    }
    const candidate = candidateManifest.clips[entry.id]
    if (!candidate || !validClip(entry.id, candidate) || candidate.text !== entry.text || candidate.bytes > 1_048_576) {
      throw new Error(`Missing or invalid current audio recording: ${entry.id}`)
    }
    const uploaded = verifiedUploads[entry.id]
    if (!uploaded || uploaded.verified !== true || uploaded.sha256 !== candidate.sha256 || uploaded.bytes !== candidate.bytes
      || uploaded.path !== `morioki-normal/${entry.id}--${candidate.sha256}.mp3`) {
      throw new Error(`Missing verified immutable audio upload: ${entry.id}`)
    }
    // Labels and references come from current teaching content, while published
    // records (including R2 reuse and retired content) retain their original values.
    nextManifest.clips[entry.id] = { ...structuredClone(candidate), ...structuredClone(entry) }
    nextIndex.clips[entry.id] = candidate.duration
    nextSources.clips[entry.id] = { provider: 'supabase', path: uploaded.path, sha256: uploaded.sha256,
      bytes: uploaded.bytes, duration: candidate.duration }
    added++
  }
  const pending = catalog.entries.filter(entry => !nextSources.clips[entry.id])
  if (pending.length) throw new Error(`Current learning content is missing ${pending.length} verified audio recordings`)
  nextManifest.lessonDates = [...new Set([...catalog.lessonDates, ...manifest.lessonDates])]
  nextManifest.complete = true
  nextManifest.expectedClips = Object.keys(nextManifest.clips).length
  if (manifest.nonLessonSnapshot !== undefined) nextManifest.nonLessonSnapshot = advanceNonLessonSnapshot(manifest, catalog, nextManifest.clips)
  nextSources.complete = true
  const hosted = Object.entries(nextSources.clips)
  nextSources.summary = {
    total: hosted.length,
    reused: hosted.filter(([, clip]) => clip.provider === 'daily').length,
    uploads: hosted.filter(([, clip]) => clip.provider === 'supabase').length,
    savedBytes: hosted.filter(([, clip]) => clip.provider === 'daily').reduce((sum, [id]) => sum + nextManifest.clips[id].bytes, 0),
    uploadBytes: hosted.filter(([, clip]) => clip.provider === 'supabase').reduce((sum, [, clip]) => sum + clip.bytes, 0),
  }
  if (added) {
    if (!Number.isFinite(Date.parse(now))) throw new Error('Audio verification time is invalid')
    nextManifest.generatedAt = now
    nextSources.verifiedAt = now
    for (const record of [nextManifest.clips, nextIndex.clips, nextSources.clips]) {
      const sorted = Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
      for (const key of Object.keys(record)) delete record[key]
      Object.assign(record, Object.fromEntries(sorted))
    }
  }
  validateAudioSources(nextManifest, nextSources)
  return { manifest: nextManifest, index: nextIndex, sources: nextSources,
    pending: { version: 1, voice: structuredClone(catalog.voice), requiredClips: catalog.entries.length,
      pendingClips: 0, incompleteLessonDates: [] as string[], entries: [] as Catalog['entries'] } }
}
