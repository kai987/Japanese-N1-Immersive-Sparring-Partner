import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { collectAudio } from './collect-audio.ts'
import { audioId, audioRelativePath, audioVoice } from '../src/lib/audioText.ts'
import { audioSources, type AudioSources } from '../src/lib/audioSources.ts'

export type Clip = { id: string; text: string; label: string; references: string[]; duration: number; bytes: number; sha256: string; rms: number }
export type Manifest = { version: number; voice: typeof audioVoice; engineVersion: string; modelVersion: string; generatedAt: string; complete: boolean; expectedClips: number; lessonDates: string[]; clips: Record<string, Clip> }
export function validateAudioSources(manifest: Manifest, sources: AudioSources, requirePublished = true) {
  if (sources.version !== 1 || JSON.stringify(sources.voice) !== JSON.stringify(manifest.voice) || sources.modelVersion !== manifest.modelVersion) throw new Error('Hosted audio voice/model differs from the verified recordings')
  if (requirePublished && (!sources.complete || !sources.verifiedAt || !Number.isFinite(Date.parse(sources.verifiedAt)))) throw new Error('Hosted audio has not completed remote verification')
  if (!/^[a-f0-9]{40}$/.test(sources.sharedSource.commit)) throw new Error('Shared daily audio must reference an immutable source commit')
  for (const base of Object.values(sources.providers)) {
    const url = new URL(base)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/')) throw new Error('Hosted audio must use public HTTPS base URLs without embedded credentials')
  }
  const clips = Object.entries(sources.clips)
  if (clips.length !== Object.keys(manifest.clips).length || clips.length !== sources.summary.total) throw new Error('Hosted audio catalog is incomplete')
  let reused = 0, uploads = 0, uploadBytes = 0, savedBytes = 0
  for (const [id, recording] of clips) {
    const original = manifest.clips[id]
    if (!original || !/^[a-f0-9]{64}$/.test(recording.sha256) || !Number.isSafeInteger(recording.bytes) || recording.bytes < 512 || !Number.isFinite(recording.duration) || recording.duration < .12) throw new Error(`Invalid hosted audio metadata: ${id}`)
    if (recording.provider === 'supabase') {
      if (recording.path !== `morioki-normal/${id}--${original.sha256}.mp3` || recording.sha256 !== original.sha256 || recording.bytes !== original.bytes || recording.duration !== original.duration) throw new Error(`Supabase recording differs from the verified local file: ${id}`)
      uploads++; uploadBytes += recording.bytes
    } else if (recording.provider === 'daily') {
      if (!/^japanese\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9_-]+--[a-f0-9]{64}\.mp3$/.test(recording.path) || !recording.path.endsWith(`--${recording.sha256}.mp3`)) throw new Error(`Daily audio must use an immutable byte-hash URL: ${id}`)
      reused++; savedBytes += original.bytes
    } else throw new Error(`Unknown hosted audio provider: ${id}`)
  }
  if (reused !== sources.summary.reused || uploads !== sources.summary.uploads || uploadBytes !== sources.summary.uploadBytes || savedBytes !== sources.summary.savedBytes) throw new Error('Hosted audio deduplication totals are inconsistent')
  return { reused, uploads, uploadBytes, savedBytes }
}
export function validateAudio({ allowIncomplete = false, requireCurrent = false, requireLocal = false } = {}) {
  const root = new URL('../', import.meta.url)
  const manifest = JSON.parse(readFileSync(new URL('public/audio/manifest.json', root), 'utf8')) as Manifest
  const index = JSON.parse(readFileSync(new URL('src/data/audio-index.json', root), 'utf8')) as { version: number; voice: typeof audioVoice; clips: Record<string, number> }
  if (manifest.version !== 1 || JSON.stringify(manifest.voice) !== JSON.stringify(audioVoice) || JSON.stringify(index.voice) !== JSON.stringify(audioVoice)) throw new Error('Audio voice must be morioki / ノーマル (497929760), with the configured synthesis parameters')
  const clips = Object.entries(manifest.clips)
  if (manifest.complete !== (clips.length === manifest.expectedClips)) throw new Error('Audio completion metadata is inconsistent')
  if (!allowIncomplete && !manifest.complete) throw new Error(`Audio generation is incomplete: ${clips.length}/${manifest.expectedClips}`)
  if (Object.keys(index.clips).length !== clips.length) throw new Error('Client audio index and manifest differ')
  if (audioSources.complete) validateAudioSources(manifest, audioSources)
  let bytes = 0
  for (const [id, clip] of clips) {
    if (!/^[0-9a-f]{16}$/.test(id) || clip.id !== id || audioId(clip.text) !== id) throw new Error(`Audio text/ID mismatch: ${id}`)
    if (!clip.label || !clip.references.length || !Number.isFinite(clip.duration) || clip.duration < .12 || !Number.isFinite(clip.rms) || clip.rms < .0005 || !Number.isSafeInteger(clip.bytes) || clip.bytes < 512 || !/^[a-f0-9]{64}$/.test(clip.sha256) || index.clips[id] !== clip.duration) throw new Error(`Invalid audio metadata: ${id}`)
    const file = new URL(`public/${audioRelativePath(id)}`, root)
    if (!existsSync(file) && !requireLocal && audioSources.complete && audioSources.clips[id]) { bytes += clip.bytes; continue }
    const buffer = readFileSync(file)
    if (buffer.length !== clip.bytes || buffer.length < 512 || createHash('sha256').update(buffer).digest('hex') !== clip.sha256) throw new Error(`Audio bytes/hash mismatch: ${id}`)
    bytes += buffer.length
  }
  const plan = collectAudio()
  for (const entry of plan.entries) {
    const clip = manifest.clips[entry.id]
    if (clip && clip.text !== entry.text) throw new Error(`Current speech text differs from its recording: ${entry.id}`)
  }
  const missing = plan.entries.filter(entry => !manifest.clips[entry.id])
  // New daily imports can remain readable before the next local synthesis run.
  // Published recordings must always cover the snapshot they declare complete.
  const snapshotDates = new Set(manifest.lessonDates)
  const missingSnapshot = missing.filter(entry => entry.references.some(ref => !ref.startsWith('lesson/') || snapshotDates.has(ref.split('/')[1])))
  if (!allowIncomplete && missingSnapshot.length) throw new Error(`The published audio snapshot is missing ${missingSnapshot.length} clips`)
  if (requireCurrent && missing.length) throw new Error(`Current learning content is missing ${missing.length} clips; run npm run audio:generate`)
  const directory = new URL('public/audio/morioki-normal/', root)
  const files = existsSync(directory) ? readdirSync(directory).filter(name => name.endsWith('.mp3') && !name.endsWith('.partial.mp3')) : []
  return { clips: clips.length, expected: plan.entries.length, files: files.length, hosted: audioSources.complete ? Object.keys(audioSources.clips).length : 0, missing: missing.length, bytes }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateAudio({ allowIncomplete: process.argv.includes('--allow-incomplete'), requireCurrent: !process.argv.includes('--allow-incomplete') && !process.argv.includes('--snapshot'), requireLocal: process.argv.includes('--local') })
  console.log(`Audio verified: ${result.clips}/${result.expected} clips, ${result.bytes} bytes, ${result.missing} missing; AivisSpeech / morioki / ノーマル (497929760)`)
}
