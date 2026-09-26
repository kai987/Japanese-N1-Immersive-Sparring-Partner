import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {validateStudySnapshot,withItStudy,type StudySnapshot} from '../src/lib/itStudy.ts'
import type {DailyLesson} from '../src/types.ts'

test('derived vocabulary retains source context and nuance without changing learner IDs',()=>{
  const snapshot=validateStudySnapshot(JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json',import.meta.url),'utf8')) as StudySnapshot)
  const date='2026-09-18'
  const raw=JSON.parse(readFileSync(new URL(`../src/data/daily/${date}.json`,import.meta.url),'utf8')).lesson as DailyLesson
  const first=withItStudy(raw,snapshot)
  for(const [i,source] of snapshot.lessons[date].vocabulary.entries()){
    for(const text of [source.note,source.nuance]) if(text?.trim()) assert.ok(first.vocabulary[i].nuance.includes(text))
    assert.equal(first.vocabulary[i].example,source.exampleJa)
    assert.equal(first.vocabulary[i].jlpt,source.level)
  }
  const repeated=withItStudy(first,snapshot)
  assert.deepEqual(repeated.vocabulary.map(c=>c.id),first.vocabulary.map(c=>c.id))
  assert.deepEqual(repeated.vocabulary.map(c=>c.nuance),first.vocabulary.map(c=>c.nuance))
  assert.deepEqual(first.immersion,raw.immersion)
  assert.deepEqual(first.reading,raw.reading)
})
