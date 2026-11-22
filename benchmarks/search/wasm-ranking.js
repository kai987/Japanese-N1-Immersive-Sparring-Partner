import init, { Ranker } from './generated/n1_search_bench.js'

let kernel, memory
export async function initializeKernel(index) {
  ;({ memory } = await init({ module_or_path: '/bench/ranking.wasm' }))
  kernel = new Ranker()
  for (const { lesson, chunks } of index) {
    kernel.lesson(lesson.date)
    for (const chunk of chunks) kernel.chunk(chunk.normalized, chunk.compact, chunk.priority)
  }
}
export const linearBytes = () => memory.buffer.byteLength
export function rankLessons(query, index) {
  const rows = kernel.rank(query.normalized, query.compact)
  const lessons = []
  for (let i = 0; i < rows.length; i += 4) {
    const record = index[rows[i]]
    lessons.push({ lesson: record.lesson, best: record.chunks[rows[i + 1]], score: rows[i + 2], hits: rows[i + 3] })
  }
  return lessons
}
