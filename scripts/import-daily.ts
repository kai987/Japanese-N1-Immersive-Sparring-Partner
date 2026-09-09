import { readFileSync, writeFileSync, renameSync, readdirSync, mkdirSync, unlinkSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { validateArchive, mergeArchives } from '../src/lib/archive.ts'
import { lessons } from '../src/data/history-legacy.ts'

export function importDaily(source: string, directory = fileURLToPath(new URL('../src/data/daily/', import.meta.url))) {
  const filename = basename(source)
  const entry = validateArchive(JSON.parse(readFileSync(source, 'utf8')), filename)
  mkdirSync(directory, { recursive: true })
  const existing = Object.fromEntries(readdirSync(directory).filter(name => name.endsWith('.json') && name !== filename)
    .map(name => [name, JSON.parse(readFileSync(join(directory, name), 'utf8'))]))
  mergeArchives(lessons, { ...existing, [filename]: entry })
  const destination = join(directory, filename)
  const temporary = `${destination}.${randomUUID()}.tmp`
  try {
    writeFileSync(temporary, JSON.stringify(entry, null, 2) + '\n', { flag: 'wx' })
    renameSync(temporary, destination)
  } finally {
    try { unlinkSync(temporary) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return destination
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('使い方: npm run import:daily -- /path/to/YYYY-MM-DD.json')
  console.log(`Imported: ${importDaily(resolve(process.argv[2]))}`)
}
