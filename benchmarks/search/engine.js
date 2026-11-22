import { searchProject } from '../../src/lib/projectSearch.ts'
import { decodeLessonSearchIndex, decodeProjectNotesIndex } from '../../src/lib/searchIndexCodec.ts'
import { initializeKernel, linearBytes } from 'bench:kernel'

let index, notes
async function dataset(path) {
  const response = await fetch(path)
  if (!response.ok) throw Error(path + ' HTTP ' + response.status)
  return response.json()
}
export async function initialize() {
  const [lessons, packedNotes] = await Promise.all([dataset('/bench/index.json'), dataset('/bench/notes.json')])
  index = decodeLessonSearchIndex(lessons)
  notes = decodeProjectNotesIndex(packedNotes)
  await initializeKernel(index)
  return { wasmBytes: linearBytes() }
}
export function query(text, limit) {
  const started = performance.now()
  const groups = searchProject(text, index, { notes, limit })
  return { groups, compute: performance.now() - started }
}
if (typeof document === 'undefined')
  self.onmessage = async ({ data }) => {
    try {
      self.postMessage(data.init ? await initialize() : query(data.text, data.limit))
    } catch (error) {
      self.postMessage({ error: String(error) })
    }
  }
