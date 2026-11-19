import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mergeArchives } from '../src/lib/archive.ts'
import { validateMirroredGrammarHistory } from '../src/lib/grammarHistory.ts'
import { validateStudySnapshot, withItStudy, type StudySnapshot } from '../src/lib/itStudy.ts'
import { lessons } from '../src/data/history-legacy.ts'
import { validatePracticeSource } from './lib/practiceSource.ts'
import { validatePracticeCoverage } from '../src/lib/practice.ts'

export function validateContent() {
  const directory = new URL('../src/data/daily/', import.meta.url)
  const modules = Object.fromEntries(readdirSync(directory).filter(name => name.endsWith('.json')).map(name => {
    const file = new URL(name, directory)
    try { return [name, JSON.parse(readFileSync(file, 'utf8'))] }
    catch (error) { throw new Error(`${name}: JSONを読み込めません`, { cause: error }) }
  }))
  const practiceDirectory = new URL('../src/data/practice/', import.meta.url)
  const practices = existsSync(practiceDirectory) ? Object.fromEntries(readdirSync(practiceDirectory).filter(name => name.endsWith('.json')).map(name => {
    try { return [name, JSON.parse(readFileSync(new URL(name, practiceDirectory), 'utf8'))] }
    catch (error) { throw new Error(`practice/${name}: JSONを読み込めません`, { cause: error }) }
  })) : {}
  const catalog = mergeArchives(lessons, modules, practices)
  validatePracticeCoverage(catalog.lessons)
  validateMirroredGrammarHistory(catalog.generated.map(entry => entry.lesson))
  const snapshot = validateStudySnapshot(JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json',import.meta.url),'utf8')) as StudySnapshot)
  for (const lesson of catalog.lessons) {
    if (lesson.practice) validatePracticeSource(lesson.practice)
    const displayed=withItStudy(lesson,snapshot)
    for (const cards of [displayed.vocabulary,displayed.grammar]) if(new Set(cards.map(card=>card.id)).size!==cards.length) throw new Error(`${lesson.date}: duplicate study progress id`)
  }
  return catalog
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = validateContent()
  console.log(`Validated ${catalog.lessons.length} lessons (${catalog.generated.length} daily JSON files).`)
}
