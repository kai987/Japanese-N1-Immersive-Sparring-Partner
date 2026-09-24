import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateStudySnapshot, withItStudy, type StudySnapshot } from '../src/lib/itStudy.ts'
import type { DailyLesson } from '../src/types.ts'
const load=()=>JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json',import.meta.url),'utf8')) as StudySnapshot
const raw=()=>JSON.parse(readFileSync(new URL('../src/data/daily/2026-09-18.json',import.meta.url),'utf8')).lesson as DailyLesson
test('source snapshot uses the complete report denominator and distinguishes issue #38 from N1 Day20',()=>{
 const snapshot=validateStudySnapshot(load()), lesson=withItStudy(raw(),snapshot)
 assert.equal(lesson.issueNumber,38); assert.equal(lesson.day,20)
 assert.equal(lesson.vocabulary.length,20); assert.equal(lesson.grammar.length,7)
 assert.equal(lesson.vocabulary.filter(c=>c.studyKind==='review').length,3)
 assert.equal(lesson.grammar.filter(c=>c.studyKind==='new').length,0)
 assert.ok(lesson.grammar.every(c=>c.reportFrequency?.totalDays===snapshot.totalDays))
})
test('independent reading, immersion and same-card progress keys stay unchanged',()=>{
 const original=raw(), lesson=withItStudy(original,load())
 assert.deepEqual(lesson.immersion,original.immersion); assert.deepEqual(lesson.reading,original.reading)
 assert.equal(lesson.title,original.title)
 for(const card of original.vocabulary){const kept=lesson.vocabulary.find(x=>x.word===card.word && x.example===card.example); if(kept)assert.equal(kept.id,card.id)}
 assert.equal(new Set(lesson.vocabulary.map(x=>x.id)).size,20)
 assert.deepEqual(withItStudy(lesson,load()).grammar.map(x=>x.id),lesson.grammar.map(x=>x.id))
})
test('tampered frequencies, duplicate cards, and falsely new reviews fail validation',()=>{
 let data=load(); data.lessons['2026-09-18'].vocabulary[0].reportFrequency.totalDays=20; assert.throws(()=>validateStudySnapshot(data),/frequency/)
 data=load(); data.lessons['2026-09-18'].grammar.push(data.lessons['2026-09-18'].grammar[0]);assert.throws(()=>validateStudySnapshot(data),/duplicate/)
 data=load(); data.lessons['2026-09-18'].grammar[0].studyKind='new';assert.throws(()=>validateStudySnapshot(data),/repeated NEW/)
})
test('reference levels are preserved instead of promoting N3 to N1',()=>{
 const snapshot=load(), lesson=withItStudy(raw(),snapshot)
 assert.deepEqual(lesson.grammar.map(x=>x.level),snapshot.lessons['2026-09-18'].grammar.map(x=>x.level))
})
test('IT/AI reference levels are preserved while unknown levels remain invalid',()=>{
 const snapshot=load()
 snapshot.lessons['2026-09-18'].vocabulary[0].level='IT/AI'
 assert.doesNotThrow(()=>validateStudySnapshot(snapshot))
 const lesson=withItStudy(raw(),snapshot)
 assert.equal(lesson.vocabulary[0].jlpt,'IT/AI')
 const invalid=load()
 invalid.lessons['2026-09-18'].vocabulary[0].level='UNKNOWN'
 assert.throws(()=>validateStudySnapshot(invalid),/invalid\/duplicate study card/)
})

test('five, six and seven grammar cards are valid without padding to eight',()=>{
 for(const count of [5,6,7]){
  const data=load()
  data.lessons['2026-09-18'].grammar=data.lessons['2026-09-18'].grammar.slice(0,count)
  data.grammarLessons!['2026-09-18'].grammar=data.lessons['2026-09-18'].grammar
  assert.doesNotThrow(()=>validateStudySnapshot(data))
 }
 const short=load();short.lessons['2026-09-18'].grammar=short.lessons['2026-09-18'].grammar.slice(0,3)
 short.grammarLessons!['2026-09-18'].grammar=short.lessons['2026-09-18'].grammar
 assert.throws(()=>validateStudySnapshot(short),/shortfall/)
})
test('historical IT grammar overlays preserve vocabulary, source text, questions and stable IDs',()=>{
 const date='2026-09-09'
 const original=JSON.parse(readFileSync(new URL(`../src/data/daily/${date}.json`,import.meta.url),'utf8')).lesson as DailyLesson
 const snapshot=validateStudySnapshot(load()),lesson=withItStudy(original,snapshot)
 assert.equal(lesson.grammar.length,snapshot.grammarLessons![date].grammar.length)
 assert.ok(lesson.grammar.some(card=>card.studyKind==='review'))
 assert.deepEqual(lesson.vocabulary.map(({reportFrequency,...card})=>card),original.vocabulary.map(({reportFrequency,...card})=>card))
 assert.deepEqual(lesson.immersion,original.immersion);assert.deepEqual(lesson.reading,original.reading)
 for(const card of original.grammar){const kept=lesson.grammar.find(x=>x.pattern===card.pattern && x.example===card.example);if(kept)assert.equal(kept.id,card.id)}
 assert.deepEqual(withItStudy(lesson,snapshot).grammar.map(card=>card.id),lesson.grammar.map(card=>card.id))
})
test('historical snapshot rejects missing dates, false-new cards and absent evidence',()=>{
 let data=load();delete data.grammarLessons!['2026-09-09'];assert.throws(()=>validateStudySnapshot(data),/Incomplete/)
 data=load();data.grammarLessons!['2026-09-09'].grammar.find(card=>card.studyKind==='review')!.studyKind='new';assert.throws(()=>validateStudySnapshot(data),/repeated NEW/)
 data=load();delete data.grammarLessons!['2026-09-09'].grammar.find(card=>card.studyKind==='review')!.reviewEvidence;assert.throws(()=>validateStudySnapshot(data),/evidence/)
})