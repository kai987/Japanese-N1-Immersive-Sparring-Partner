import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { audioId, audioVoice, normalizeAudioText } from '../src/lib/audioText.ts'

export type DailyCandidate = { text: string; path: string; sha256: string; manifest: string; date: string }
type DailyManifest = {
  date: string; voice?: { name?: string; style?: string; styleId?: number; speakerUuid?: string; modelVersion?: string }
  format?: { container?: string; sampleRate?: number; channels?: number }
  settings?: { wordSpeed?: number; exampleSpeed?: number; speed?: number; intonationScale?: number }
  items?: Array<{ studyKind?: string; reading?: string; term?: string; word?: string; wordSha256?: string; exampleJa?: string; example?: string; exampleSha256?: string }>
  grammar?: Array<{ studyKind?: string; exampleJa?: string; example?: string; exampleSha256?: string }>
  interview?: Array<{ text?: string; audio?: string; audioSha256?: string }>
  review?: Array<{ text?: string; audio?: string; audioSha256?: string }>
}

// Reuse requires the complete utterance and the same voice/model, speed,
// intonation and mono sample rate. MP3 bitrate and edge silence can differ.
export function dailyCandidates(manifest: DailyManifest, source: string, modelVersion: string): DailyCandidate[] {
  const voice = manifest.voice, format = manifest.format, settings = manifest.settings
  if (voice?.name !== audioVoice.name || voice.style !== audioVoice.style || voice.styleId !== audioVoice.styleId
    || voice.speakerUuid !== audioVoice.speakerUuid || voice.modelVersion !== modelVersion
    || format?.container !== 'mp3' || format.sampleRate !== audioVoice.sampleRate || format.channels !== 1
    || settings?.intonationScale !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.date)) return []
  const candidates: DailyCandidate[] = []
  const add = (text: string | undefined, file: string | undefined, sha256: string | undefined, speed: number | undefined) => {
    if (!text?.trim() || !file || !/^[A-Za-z0-9_-]+\.mp3$/.test(file) || !sha256 || !/^[a-f0-9]{64}$/.test(sha256) || speed !== audioVoice.speed) return
    const immutable = `${file.slice(0, -4)}--${sha256}.mp3`
    candidates.push({ text: normalizeAudioText(text), path: `japanese/${manifest.date}/${immutable}`, sha256, manifest: source, date: manifest.date })
  }
  for (const item of manifest.items ?? []) {
    // Reviews point to their first-introduced date. That original manifest is
    // indexed independently, so never infer text/settings from a later review.
    if (item.studyKind === 'review') continue
    add(item.reading || item.term, item.word, item.wordSha256, settings.wordSpeed)
    add(item.exampleJa, item.example, item.exampleSha256, settings.exampleSpeed)
  }
  for (const item of manifest.grammar ?? []) if (item.studyKind !== 'review') add(item.exampleJa, item.example, item.exampleSha256, settings.exampleSpeed)
  for (const item of [...manifest.interview ?? [], ...manifest.review ?? []]) add(item.text, item.audio, item.audioSha256, settings.speed)
  return candidates
}

async function main() {
  const args = process.argv.slice(2)
  const option = (name: string, fallback = '') => { const at = args.indexOf(name); return at < 0 ? fallback : args[at + 1] }
  const repo = option('--daily-repo')
  if (!repo) throw new Error('Provide --daily-repo PATH to the existing Japan IT / AI Daily checkout')
  const commit = execFileSync('git', ['rev-parse', '--verify', `${option('--ref', 'origin/main')}^{commit}`], { cwd: repo, encoding: 'utf8' }).trim()
  const base = option('--daily-base', 'https://pub-7561025e67be4103ac4bafb331864381.r2.dev/').replace(/\/*$/, '/')
  const parsed = new URL(base)
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('Daily audio base must be a public HTTPS URL')
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, 'public/audio/japanese/'], { cwd: repo, encoding: 'utf8' }).trim().split('\n')
    .filter(path => /^public\/audio\/japanese\/\d{4}-\d{2}-\d{2}\/(?:interview-)?manifest\.json$/.test(path))
  const manifest = JSON.parse(readFileSync(new URL('../public/audio/manifest.json', import.meta.url), 'utf8'))
  if (!manifest.complete) throw new Error('Finish local audio generation before publishing')
  const byId = new Map<string, DailyCandidate[]>()
  for (const path of paths.sort().reverse()) {
    const dailyManifest = JSON.parse(execFileSync('git', ['show', `${commit}:${path}`], { cwd: repo, encoding: 'utf8' })) as DailyManifest
    for (const candidate of dailyCandidates(dailyManifest, path, manifest.modelVersion)) {
      const id = audioId(candidate.text), list = byId.get(id) ?? []
      if (!list.some(item => item.path === candidate.path)) list.push(candidate)
      byId.set(id, list)
    }
  }
  const clips = Object.values(manifest.clips) as Array<{ id: string; text: string; bytes: number; duration: number; sha256: string }>
  const candidates = clips.filter(clip => byId.has(clip.id))
  console.log(`Compared ${paths.length} daily manifests at ${commit}; ${candidates.length}/${clips.length} complete utterances match`)
  const shared: Record<string, DailyCandidate & { url: string; bytes: number; duration: number }> = {}
  const rejected: Array<{ id: string; path: string; reason: string }> = []
  if (args.includes('--verify')) {
    const queue = [...candidates]
    const work = mkdtempSync(join(tmpdir(), 'n1-shared-audio-'))
    let completed = 0
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const clip = queue.shift()!
        for (const candidate of byId.get(clip.id)!) {
          if (candidate.text !== clip.text) throw new Error(`Speech identity collision for ${clip.id}`)
          const url = new URL(candidate.path, base).href
          try {
            const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const bytes = Buffer.from(await response.arrayBuffer())
            if (createHash('sha256').update(bytes).digest('hex') !== candidate.sha256) throw new Error('SHA-256 mismatch')
            const temporary = join(work, `${clip.id}.mp3`)
            writeFileSync(temporary, bytes)
            const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', temporary], { encoding: 'utf8' }))
            rmSync(temporary)
            if (!Number.isFinite(duration) || duration < .12) throw new Error('Invalid decoded audio duration')
            shared[clip.id] = { ...candidate, url, bytes: bytes.length, duration: Math.round(duration * 1000) / 1000 }
            break
          } catch (error) { rejected.push({ id: clip.id, path: candidate.path, reason: String(error) }) }
        }
        completed++
        if (completed % 100 === 0 || completed === candidates.length) console.log(`Verified shared audio ${completed}/${candidates.length}; reusable ${Object.keys(shared).length}`)
      }
    }))
    rmSync(work, { recursive: true })
  }
  const uploads = clips.filter(clip => !shared[clip.id]).map(clip => ({ ...clip, path: `morioki-normal/${clip.id}--${clip.sha256}.mp3` }))
  const result = { version: 1, sourceCommit: commit, sourceRepository: 'https://github.com/kai987/japan-it-ai-daily', dailyBase: base,
    verified: args.includes('--verify'), shared, uploads, rejected,
    summary: { total: clips.length, matchingText: candidates.length, reused: Object.keys(shared).length, uploads: uploads.length, savedBytes: clips.filter(clip => shared[clip.id]).reduce((sum, clip) => sum + clip.bytes, 0), uploadBytes: uploads.reduce((sum, clip) => sum + clip.bytes, 0) } }
  const output = option('--output', '/tmp/n1-audio-storage-plan.json')
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result.summary), `Plan: ${output}`)
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
