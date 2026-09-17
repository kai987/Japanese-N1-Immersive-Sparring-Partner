import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { grammarIdentity, validateMirroredGrammarHistory } from '../src/lib/grammarHistory.ts'
import { validateLesson } from '../src/lib/archive.ts'
import type { DailyLesson } from '../src/types.ts'
const entries = () => readdirSync(new URL('../src/data/daily/',import.meta.url)).filter(n => n.endsWith('.json')).map(n => JSON.parse(readFileSync(new URL('../src/data/daily/'+n,import.meta.url),'utf8')).lesson as DailyLesson)
test('grammar aliases normalize without merging distinct functions', () => {
  assert.equal(grammarIdentity('～た上で'),grammarIdentity('～たうえで'))
  assert.equal(grammarIdentity('～に伴い'),grammarIdentity('～に伴って'))
  assert.notEqual(grammarIdentity('～する上で'),grammarIdentity('～した上で'))
  assert.notEqual(grammarIdentity('～にかかわらず'),grammarIdentity('～にもかかわらず'))
  assert.notEqual(grammarIdentity('～かねる'),grammarIdentity('～かねない'))
})
test('all generated historical grammar mirrors remain unique', () => {
  const result = validateMirroredGrammarHistory(entries())
  assert.ok(result.dates >= 9)
  assert.ok(result.grammar >= 10)
})
test('distant and same-day duplicates are rejected', () => {
  const data = entries(); const a = data[0]; const b = data[1]
  b.grammar = [structuredClone(a.grammar[0])]
  assert.throws(() => validateMirroredGrammarHistory(data),/duplicate grammar/)
  a.grammar.push(structuredClone(a.grammar[0]))
  assert.throws(() => validateMirroredGrammarHistory([a]),/duplicate grammar/)
})
test('zero new grammar is valid only with an explicit explanation', () => {
  const lesson = entries()[0]; lesson.grammar = []
  lesson.grammarSelectionNote = '当天原文经完整历史核对后，没有可新增且符合来源要求的语法，不使用旧语法补数。'
  validateLesson(lesson,'zero')
  validateMirroredGrammarHistory([lesson])
  delete lesson.grammarSelectionNote
  assert.throws(() => validateLesson(lesson,'zero'),/grammarSelectionNote/)
  assert.throws(() => validateMirroredGrammarHistory([lesson]),/grammarSelectionNote/)
})
test('a missing grammar array remains invalid', () => {
  const lesson = entries()[0]; delete (lesson as Partial<DailyLesson>).grammar
  assert.throws(() => validateLesson(lesson,'missing'),/grammar/)
})
