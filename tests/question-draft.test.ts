import test from 'node:test'
import assert from 'node:assert/strict'
import { clearQuestionDraft, readQuestionDraft, saveQuestionDraft, type DraftStorage } from '../src/lib/questionDraft.ts'
import type { ReadingQuestion } from '../src/types.ts'

const question: ReadingQuestion = { id: 'draft-question', prompt: '問い', options: ['一', '二', '三', '四'], answer: 1, explanation: '解説', optionNotes: ['一', '二', '三', '四'] }
function memoryStorage(): DraftStorage {
  const values = new Map<string, string>()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: key => { values.delete(key) } }
}

test('unsubmitted choices survive remount/reload but never create answer history', () => {
  const storage = memoryStorage()
  saveQuestionDraft(question, undefined, [], { selected: 2, retrying: false }, storage)
  assert.deepEqual(readQuestionDraft(question, undefined, [], false, storage), { selected: 2, retrying: false })
  assert.deepEqual(readQuestionDraft({ ...question, id: 'another-question' }, undefined, [], false, storage), { selected: null, retrying: false })
  clearQuestionDraft(question.id, storage)
  assert.deepEqual(readQuestionDraft(question, undefined, [], false, storage), { selected: null, retrying: false })
})

test('retry drafts preserve prior submissions and expire when history or content changes', () => {
  const storage = memoryStorage()
  const history = [{ answer: 0, at: '2026-11-21T01:00:00Z' }]
  saveQuestionDraft(question, 0, history, { selected: 1, retrying: true }, storage)
  assert.deepEqual(readQuestionDraft(question, 0, history, false, storage), { selected: 1, retrying: true })
  assert.deepEqual(readQuestionDraft(question, 1, [...history, { answer: 1, at: '2026-11-22T01:00:00Z' }], false, storage), { selected: null, retrying: false })
  assert.deepEqual(readQuestionDraft({ ...question, options: ['甲', '乙', '丙', '丁'] }, 0, history, false, storage), { selected: null, retrying: false })
})

test('unavailable or damaged tab storage does not block learning', () => {
  const blocked: DraftStorage = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') }, removeItem() { throw Error('blocked') } }
  assert.doesNotThrow(() => saveQuestionDraft(question, undefined, [], { selected: 2, retrying: false }, blocked))
  assert.doesNotThrow(() => clearQuestionDraft(question.id, blocked))
  assert.deepEqual(readQuestionDraft(question, undefined, [], true, blocked), { selected: null, retrying: true })
  const damaged = memoryStorage()
  damaged.setItem('n1-question-draft:draft-question', '{broken')
  assert.deepEqual(readQuestionDraft(question, undefined, [], false, damaged), { selected: null, retrying: false })
})

test('malformed selected values are rejected even when the revision matches', () => {
  for (const selected of [-1, 4, 0.5, '2', {}, false]) {
    const storage = memoryStorage()
    saveQuestionDraft(question, undefined, [], { selected: 2, retrying: false }, storage)
    const key = 'n1-question-draft:draft-question'
    storage.setItem(key, JSON.stringify({ ...JSON.parse(storage.getItem(key)!), selected }))
    assert.deepEqual(readQuestionDraft(question, undefined, [], false, storage), { selected: null, retrying: false })
  }
})
