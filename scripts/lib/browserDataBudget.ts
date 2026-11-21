import { gzipSync } from 'node:zlib'

type Chunk = { type: 'chunk'; fileName: string; code: string; isEntry: boolean; imports: string[]; modules: Record<string, unknown> }
type Asset = { type: 'asset'; fileName: string; source: string | Uint8Array }
type Bundle = Record<string, Chunk | Asset>

// Allow the remaining 99-day plan and new notes to grow, while catching a return
// to shipping every audio mapping or the uncompressed three-copy search index.
export const browserDataBudget = {
  initialJavaScript: { bytes: 1_100_000, gzipBytes: 360_000 },
  searchIndex: { bytes: 8_000_000, gzipBytes: 1_900_000 },
} as const

export function assertBrowserDataBudget(bundle: Bundle, searchPath: string) {
  const initial = new Map<string, Chunk>()
  const visit = (file: Chunk) => {
    if (initial.has(file.fileName)) return
    initial.set(file.fileName, file)
    for (const path of file.imports) { const dependency = bundle[path]; if (dependency?.type === 'chunk') visit(dependency) }
  }
  for (const file of Object.values(bundle)) if (file.type === 'chunk' && file.isEntry) visit(file)
  const forbidden = /\/src\/(?:data\/(?:live-reactions(?:-[^/]+)?|live-reaction-units|compound-verbs|audio-(?:index|sources)|it-study-snapshot|history-legacy)|lib\/audioSources)\.(?:ts|json)$/
  for (const file of initial.values()) for (const id of Object.keys(file.modules)) {
    if (forbidden.test(id.replaceAll('\\', '/').split('?')[0])) throw new Error(`Full learning data entered initial JavaScript: ${id}`)
  }
  const entry = [...initial.values()].reduce((total, file) => ({ bytes: total.bytes + Buffer.byteLength(file.code), gzipBytes: total.gzipBytes + gzipSync(file.code).length }), { bytes: 0, gzipBytes: 0 })
  const search = bundle[searchPath]
  if (search?.type !== 'asset') throw new Error('Search payload missing from bundle budget')
  const searchBytes = Buffer.from(search.source)
  const searchSize = { bytes: searchBytes.length, gzipBytes: gzipSync(searchBytes).length }
  for (const [label, actual, limit] of [['Initial JavaScript', entry, browserDataBudget.initialJavaScript], ['Search index', searchSize, browserDataBudget.searchIndex]] as const) {
    if (actual.bytes > limit.bytes || actual.gzipBytes > limit.gzipBytes) {
      throw new Error(`${label} exceeds browser data budget: ${actual.bytes} bytes / ${actual.gzipBytes} gzip; limit ${limit.bytes} / ${limit.gzipBytes}`)
    }
  }
  return { initialJavaScript: entry, searchIndex: searchSize }
}
