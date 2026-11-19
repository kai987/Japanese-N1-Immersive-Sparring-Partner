import { readFileSync } from 'node:fs'
import type { DailyPractice } from '../../src/types.ts'

/** Public source matching is a build gate, not a writer or a new checkpoint queue. */
export function validatePracticeSource(practice: DailyPractice, repositoryRoot = new URL('../../', import.meta.url)) {
  const source = readFileSync(new URL(practice.sourcePath, repositoryRoot), 'utf8')
  const heading = source.split('\n').find(line => /^#\s/.test(line)) ?? ''
  if (!heading.includes(practice.date) || !new RegExp(`\\bDay\\s*${practice.day}\\b`).test(heading)) {
    throw new Error(`${practice.sourcePath}: practice source date/Day mismatch`)
  }
  for (const group of practice.groups) {
    const publicText = [group.title, group.instructions, ...group.paragraphs,
      ...(group.table ? [group.table.caption, ...group.table.headers, ...group.table.rows.flat()] : []),
      ...group.questions.flatMap(question => [question.prompt, ...question.options])]
    for (const text of publicText) {
      if (!source.includes(text)) throw new Error(`${practice.sourcePath}: complete practice text missing for ${group.id}: ${text.slice(0, 48)}`)
    }
  }
  return source
}
