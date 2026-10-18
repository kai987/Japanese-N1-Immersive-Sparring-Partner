import { createHash } from 'node:crypto'
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { validateAudioSources } from './validate-audio.ts'
import type { AudioSources, HostedRecording } from '../src/lib/audioSources.ts'

const catalogPath = new URL('../src/data/audio-sources.json', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('../public/audio/manifest.json', import.meta.url), 'utf8'))
const planIndex = process.argv.indexOf('--plan')
const plan = planIndex < 0 ? null : JSON.parse(readFileSync(process.argv[planIndex + 1], 'utf8'))
const publish = process.argv.includes('--publish') || !!plan
let sources = JSON.parse(readFileSync(catalogPath, 'utf8')) as AudioSources
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
validateAudioSources(manifest, sources, !publish)
const queue = Object.entries(sources.clips)
const total = queue.length
const failed: Array<{ id: string; error: string }> = []
let verified = 0, bytes = 0
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const [id, recording] = queue.shift()!
    const url = new URL(recording.path, sources.providers[recording.provider]).href
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = Buffer.from(await response.arrayBuffer())
        if (data.length !== recording.bytes || createHash('sha256').update(data).digest('hex') !== recording.sha256) throw new Error('Remote bytes/SHA-256 differ from the verified recording')
        verified++; bytes += data.length
        if (verified % 200 === 0 || verified === total) console.log(`Remote audio verified: ${verified}/${total}`)
        break
      } catch (error) {
        if (attempt === 3) failed.push({ id, error: String(error) })
        else await new Promise(resolve => setTimeout(resolve, attempt * 500))
      }
    }
  }
}))
if (failed.length) throw new Error(`${failed.length} remote recordings failed verification: ${JSON.stringify(failed.slice(0, 10))}`)
if (publish) {
  sources.complete = true
  sources.verifiedAt = new Date().toISOString()
  const temporary = new URL('../src/data/audio-sources.partial.json', import.meta.url)
  writeFileSync(temporary, JSON.stringify(sources, null, 2) + '\n')
  renameSync(temporary, catalogPath)
}
console.log(JSON.stringify({ verified, bytes, reused: sources.summary.reused, uploaded: sources.summary.uploads, published: sources.complete }))
