import { createHash } from 'node:crypto'
import { linkSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { audioSources } from '../src/lib/audioSources.ts'

const plan = JSON.parse(readFileSync(process.argv[2] || '/tmp/n1-audio-storage-plan.json', 'utf8'))
if (!plan.verified) throw new Error('Verify the daily audio reuse plan before staging new uploads')
const root = mkdtempSync(join(tmpdir(), 'n1-audio-upload-'))
const directory = join(root, 'morioki-normal')
mkdirSync(directory)
let staged = 0
for (const clip of plan.uploads) {
  if (!/^[a-f0-9]{16}$/.test(clip.id) || clip.path !== `morioki-normal/${clip.id}--${clip.sha256}.mp3` || !/^[a-f0-9]{64}$/.test(clip.sha256)) throw new Error('Unsafe or inconsistent audio upload path')
  const published = audioSources.complete && audioSources.clips[clip.id]
  if (published && published.provider === 'supabase' && published.path === clip.path && published.sha256 === clip.sha256 && published.bytes === clip.bytes) continue
  const source = new URL(`../public/audio/morioki-normal/${clip.id}.mp3`, import.meta.url)
  const bytes = readFileSync(source)
  if (bytes.length !== clip.bytes || createHash('sha256').update(bytes).digest('hex') !== clip.sha256) throw new Error(`Audio changed since the upload plan: ${clip.id}`)
  linkSync(source, join(root, clip.path))
  staged++
}
console.log(`${staged} new verified recordings ready for n1-audio/morioki-normal/\n${directory}`)
