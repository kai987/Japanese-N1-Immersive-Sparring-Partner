import { readFileSync } from 'node:fs'
import type { AudioSources, HostedRecording } from '../src/lib/audioSources.ts'
import { saveManualAudioPublication, verifyManualAudioPublication } from './lib/manualAudioPublication.ts'
import { collectAudio } from './collect-audio.ts'

const catalogPath = new URL('../src/data/audio-sources.json', import.meta.url)
const manifestPath = new URL('../public/audio/manifest.json', import.meta.url)
const pendingPath = new URL('../src/data/audio-pending.json', import.meta.url)
const manifestBytes = readFileSync(manifestPath), sourcesBytes = readFileSync(catalogPath), pendingBytes = readFileSync(pendingPath)
const manifest = JSON.parse(manifestBytes.toString('utf8'))
const planIndex = process.argv.indexOf('--plan')
const plan = planIndex < 0 ? null : JSON.parse(readFileSync(process.argv[planIndex + 1], 'utf8'))
const publish = process.argv.includes('--publish') || !!plan
let sources = JSON.parse(sourcesBytes.toString('utf8')) as AudioSources
if (plan) {
  if (!plan.verified || plan.summary.total !== Object.keys(manifest.clips).length) throw new Error('Provide a fully verified deduplication plan for the current recordings')
  const clips: Record<string, HostedRecording> = {}
  for (const [id, candidate] of Object.entries(plan.shared) as Array<[string, { text: string; path: string; sha256: string; bytes: number; duration: number }]>) {
    if (candidate.text !== manifest.clips[id]?.text) throw new Error(`Shared utterance differs from current content: ${id}`)
    clips[id] = { provider: 'daily', path: candidate.path, sha256: candidate.sha256, bytes: candidate.bytes, duration: candidate.duration }
  }
  for (const clip of plan.uploads) clips[clip.id] = { provider: 'supabase', path: clip.path, sha256: clip.sha256, bytes: clip.bytes, duration: clip.duration }
  sources = { version: 1, complete: false, voice: manifest.voice, modelVersion: manifest.modelVersion,
    sharedSource: { repository: plan.sourceRepository, commit: plan.sourceCommit },
    providers: { daily: plan.dailyBase, supabase: 'https://flpmblfscgcbrprwwckz.supabase.co/storage/v1/object/public/n1-audio/' },
    summary: plan.summary, clips: Object.fromEntries(Object.entries(clips).sort(([a], [b]) => a.localeCompare(b))) }
}
const result = await verifyManualAudioPublication(manifest, sources, { publish, catalog: publish ? collectAudio() : undefined,
  progress(verified, total) { if (verified % 200 === 0 || verified === total) console.log(`Remote audio verified: ${verified}/${total}`) },
})
if (publish) saveManualAudioPublication(manifestPath, catalogPath, result.manifest, result.sources, {
  expected: { manifest: manifestBytes, sources: sourcesBytes, pending: pendingBytes },
  pending: { path: pendingPath, value: result.pending },
})
console.log(JSON.stringify({ verified: result.verified, bytes: result.bytes, reused: result.sources.summary.reused,
  uploaded: result.sources.summary.uploads, published: result.sources.complete }))
