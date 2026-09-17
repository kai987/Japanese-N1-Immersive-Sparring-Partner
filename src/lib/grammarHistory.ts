import type { DailyLesson } from '../types.ts'
import rules from '../data/grammar-identity-rules.json' with { type: 'json' }
const aliases: Record<string,string> = rules.aliases
export function grammarIdentity(pattern: string) {
  const k = pattern.normalize('NFKC').replace(/[\s\u200b\ufeff~～〜…]/g, '')
  if (!k) throw new Error('Empty grammar identity')
  return aliases[k] ?? k
}
export function validateMirroredGrammarHistory(lessons: DailyLesson[]) {
  const seen = new Map<string,string>()
  const dates = new Set<string>()
  for (const lesson of lessons.filter(x => x.date >= '2026-09-09').sort((a,b) => a.date.localeCompare(b.date))) {
    if (dates.has(lesson.date)) throw new Error(`${lesson.date}: duplicate mirrored date`)
    dates.add(lesson.date)
    if (!Array.isArray(lesson.grammar) || lesson.grammar.length > 5) throw new Error(`${lesson.date}: mirrored grammar must contain 0..5 items`)
    if (lesson.grammar.length < 5 && (!lesson.grammarSelectionNote || lesson.grammarSelectionNote.trim().length < 20)) throw new Error(`${lesson.date}: grammarSelectionNote is required for fewer than five items`)
    if (lesson.grammarSourceCommit !== undefined && !/^[a-f0-9]{40}$/.test(lesson.grammarSourceCommit)) throw new Error(`${lesson.date}: invalid grammarSourceCommit`)
    for (const item of lesson.grammar) {
      const identity = grammarIdentity(item.pattern)
      if (seen.has(identity)) throw new Error(`${lesson.date}: duplicate grammar ${item.pattern}; first introduced ${seen.get(identity)}`)
      seen.set(identity,lesson.date)
      if (lesson.date > '2026-09-17' || item.sourceUrl !== undefined) {
        let url: URL
        try { url = new URL(item.sourceUrl ?? '') } catch { throw new Error(`${lesson.date}: invalid grammar source URL`) }
        if (url.protocol !== 'https:' || !item.sourceForm?.trim() || !item.sourceAnchor || item.sourceAnchor.trim().length < 10) throw new Error(`${lesson.date}: missing grammar source evidence`)
      }
    }
  }
  return { dates: dates.size, grammar: seen.size }
}
