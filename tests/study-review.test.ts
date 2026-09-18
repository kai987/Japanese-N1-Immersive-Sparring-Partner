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
