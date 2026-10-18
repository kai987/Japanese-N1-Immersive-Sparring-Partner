import { fileURLToPath } from 'node:url'

export const audioMetadataPaths = ['public/audio/manifest.json', 'src/data/audio-index.json', 'src/data/audio-sources.json', 'src/data/audio-pending.json']
export function verifyAudioChangedPaths(text: string) {
  const paths = text.trim().split('\n').filter(Boolean)
  if (!paths.length || paths.some(path => !audioMetadataPaths.includes(path))) throw new Error('Audio sync may commit only the four audio metadata files')
  return paths
}
if (process.argv[1] === fileURLToPath(import.meta.url)) verifyAudioChangedPaths(process.argv[2] ?? '')
