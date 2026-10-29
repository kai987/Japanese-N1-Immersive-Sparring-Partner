import test from 'node:test'
import assert from 'node:assert/strict'
import { SharedStorage, type StorageLike } from '../src/lib/sharedStorage.ts'
import { applyStorageMutations, decodeStorageMutation, storageChanges, storageJournalPrefix, type StorageMutation } from '../src/lib/storageMerge.ts'
import { decodeCompleted, decodeProgress, initialProgress } from '../src/lib/progress.ts'
import type { StoredProgress } from '../src/types.ts'

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  fail = false
  failProjection = false
  get length() { return this.values.size }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { if (this.fail || (this.failProjection && !key.startsWith('n1-record-journal-v1:'))) throw new Error('Blocked'); this.values.set(key, value) }
}
const mark = (store: SharedStorage<StoredProgress>, id: string, value: 'mastered' | 'review' | 'new') => store.update(previous => ({ ...previous, vocab: { ...previous.vocab, [id]: value } }))

test('stale tabs retain unrelated vocabulary, grammar and completion changes while explicit resets win', () => {
  const storage = new MemoryStorage()
  storage.setItem('progress', JSON.stringify({ vocab: { legacy: 'mastered' }, grammar: {}, readingAnswers: { old: 2 } }))
  const a = new SharedStorage('progress', initialProgress, decodeProgress, () => storage)
  const b = new SharedStorage('progress', initialProgress, decodeProgress, () => storage)
  mark(a, 'first', 'mastered')
  mark(b, 'second', 'review')
  b.update(previous => ({ ...previous, grammar: { ...previous.grammar, grammar: 'mastered' } }))
  a.refresh()
  assert.deepEqual(a.getSnapshot().value.vocab, { legacy: 'mastered', first: 'mastered', second: 'review' })
  assert.equal(a.getSnapshot().value.grammar.grammar, 'mastered')
  assert.deepEqual(a.getSnapshot().value.readingAttempts.old, [{ answer: 2, at: null }])
  mark(a, 'first', 'new')
  b.refresh()
  assert.equal(b.getSnapshot().value.vocab.first, 'new')
  const x = new SharedStorage('completed', {}, decodeCompleted, () => storage)
  const y = new SharedStorage('completed', {}, decodeCompleted, () => storage)
  x.update({ '2026-10-29': true }); y.update({ '2026-10-30': true }); x.update({ '2026-10-29': false })
  y.refresh()
  assert.deepEqual(y.getSnapshot().value, { '2026-10-29': false, '2026-10-30': true })
})

test('a raw projection overwritten by a genuine write race is reconstructed from both unique operations', () => {
  const a = { ...initialProgress, vocab: { a: 'mastered' as const } }, b = { ...initialProgress, vocab: { b: 'review' as const } }
  const operations: StorageMutation[] = [
    { version: 1, id: 'a', clock: 1, changes: storageChanges(initialProgress, a) },
    { version: 1, id: 'b', clock: 1, changes: storageChanges(initialProgress, b) },
  ]
  assert.deepEqual(applyStorageMutations(b, operations).vocab, { a: 'mastered', b: 'review' })
  assert.deepEqual(applyStorageMutations(b, [...operations, ...operations]).vocab, { a: 'mastered', b: 'review' })
})

test('a later stale-tab intent observes durable clocks even when wall-clock time moves backwards', () => {
  const storage = new MemoryStorage(), stale = new SharedStorage('clock', initialProgress, decodeProgress, () => storage)
  const remote = { ...initialProgress, vocab: { shared: 'mastered' as const } }
  const future: StorageMutation = { version: 1, id: 'future-clock', clock: Date.now() * 1000 + 1_000_000, changes: storageChanges(initialProgress, remote) }
  storage.setItem(storageJournalPrefix('clock') + future.id, JSON.stringify(future))
  mark(stale, 'shared', 'review')
  assert.equal(stale.getSnapshot().value.vocab.shared, 'review')
})

test('concurrent answers retain all attempts including equal timestamps and accumulate study dates', () => {
  const storage = new MemoryStorage(), a = new SharedStorage('answers', initialProgress, decodeProgress, () => storage)
  const b = new SharedStorage('answers', initialProgress, decodeProgress, () => storage)
  const answer = (store: SharedStorage<StoredProgress>, chosen: number, date: string) => store.update(previous => ({ ...previous,
    readingAnswers: { ...previous.readingAnswers, q: chosen }, readingAttempts: { ...previous.readingAttempts, q: [...(previous.readingAttempts.q ?? []), { answer: chosen, at: '2026-10-30T02:10:00.000Z' }] },
    studyDates: [...previous.studyDates, date] }))
  answer(a, 0, '2026-10-29'); answer(b, 0, '2026-10-30'); a.refresh()
  assert.equal(a.getSnapshot().value.readingAttempts.q.length, 2)
  assert.deepEqual(a.getSnapshot().value.studyDates, ['2026-10-29', '2026-10-30'])
  answer(a, 2, '2026-10-30'); b.refresh()
  assert.equal(b.getSnapshot().value.readingAnswers.q, 2)
  assert.equal(b.getSnapshot().value.readingAttempts.q.length, 3)
  b.refresh(); a.refresh()
  assert.equal(a.getSnapshot().value.readingAttempts.q.length, 3, 'journal replay is idempotent')
})

test('blocked writes preserve in-memory actions and retry merges changes made by another tab', () => {
  const storage = new MemoryStorage(), a = new SharedStorage('blocked', initialProgress, decodeProgress, () => storage)
  const b = new SharedStorage('blocked', initialProgress, decodeProgress, () => storage)
  storage.fail = true; mark(a, 'unsaved', 'mastered')
  assert.equal(a.getSnapshot().failed, true)
  assert.equal(a.getSnapshot().value.vocab.unsaved, 'mastered')
  storage.fail = false; mark(b, 'other', 'review'); a.retry()
  assert.equal(a.getSnapshot().failed, false)
  assert.deepEqual(a.getSnapshot().value.vocab, { unsaved: 'mastered', other: 'review' })
})

test('a failed projection still leaves a recoverable journal, and stale mounting never saves its initial snapshot', () => {
  const storage = new MemoryStorage(), a = new SharedStorage('projection', initialProgress, decodeProgress, () => storage)
  storage.failProjection = true; mark(a, 'recoverable', 'mastered')
  assert.equal(a.getSnapshot().failed, true)
  assert.ok([...storage.values.keys()].some(key => key.startsWith(storageJournalPrefix('projection'))))
  storage.failProjection = false
  const recovered = new SharedStorage('projection', initialProgress, decodeProgress, () => storage)
  assert.equal(recovered.getSnapshot().value.vocab.recoverable, 'mastered')
  const stale = new SharedStorage('projection', initialProgress, decodeProgress, () => storage)
  mark(recovered, 'later', 'review'); stale.retry()
  assert.deepEqual(stale.getSnapshot().value.vocab, { recoverable: 'mastered', later: 'review' })
})

test('malformed journal entries and damaged records do not discard readable legacy marks', () => {
  const storage = new MemoryStorage()
  storage.setItem('damaged', '{"vocab":{"keep":"mastered","bad":"oops"},"readingAnswers":{"q":2}}')
  storage.setItem(storageJournalPrefix('damaged') + 'broken', '{broken')
  storage.setItem(storageJournalPrefix('damaged') + 'wrong', '{"version":9}')
  const state = new SharedStorage('damaged', initialProgress, decodeProgress, () => storage)
  assert.equal(state.getSnapshot().recovered, true)
  assert.deepEqual(state.getSnapshot().value.vocab, { keep: 'mastered' })
  state.retry(); assert.equal(state.getSnapshot().failed, false)
  state.dismiss(); assert.equal(state.getSnapshot().recovered, false)
  assert.equal(decodeStorageMutation({ version: 1, id: 'bad', clock: 1, changes: [{ path: 'oops', kind: 'set' }] }), null)
})

test('schema-invalid journal operations never erase valid raw marks or independent valid edits on retry', () => {
  const storage = new MemoryStorage()
  const raw = { ...structuredClone(initialProgress), vocab: { keep: 'mastered' as const },
    readingAnswers: { old: 2 }, readingAttempts: { old: [{ answer: 2, at: null }] }, studyDates: ['2026-10-29'] }
  storage.setItem('schema', JSON.stringify(raw))
  const invalid: StorageMutation[] = [
    { version: 1, id: 'invalid-status', clock: 1, changes: [{ path: ['vocab', 'keep'], kind: 'set', value: 'invalid-status' }] },
    { version: 1, id: 'invalid-root', clock: 2, changes: [{ path: [], kind: 'set', value: null }] },
    { version: 1, id: 'invalid-history', clock: 3, changes: [{ path: ['readingAttempts', 'old'], kind: 'set', value: [{ answer: 9, at: null }] }] },
    { version: 1, id: 'invalid-date', clock: 4, changes: [{ path: ['studyDates'], kind: 'members', add: ['2026-02-30'], remove: [] }] },
  ]
  for (const mutation of invalid) storage.setItem(storageJournalPrefix('schema') + mutation.id, JSON.stringify(mutation))
  const valid: StorageMutation = { version: 1, id: 'valid-independent', clock: 5, changes: [{ path: ['grammar', 'other'], kind: 'set', value: 'review' }] }
  storage.setItem(storageJournalPrefix('schema') + valid.id, JSON.stringify(valid))
  const state = new SharedStorage('schema', initialProgress, decodeProgress, () => storage)
  assert.equal(state.getSnapshot().recovered, true)
  assert.deepEqual(state.getSnapshot().value, { ...raw, grammar: { other: 'review' } })
  state.retry()
  assert.deepEqual(JSON.parse(storage.getItem('schema')!), { ...raw, grammar: { other: 'review' } })
  state.dismiss(); state.refresh()
  assert.equal(state.getSnapshot().recovered, false, 'an already rejected operation does not reopen the recovery notice')
  mark(state, 'keep', 'new')
  assert.equal(state.getSnapshot().value.vocab.keep, 'new', 'legitimate later unmark remains possible')
  assert.equal(decodeStorageMutation({ version: 1, id: 'delete-root', clock: 1, changes: [{ path: [], kind: 'remove' }] }), null)
  assert.equal(decodeStorageMutation({ version: 1, id: 'missing-value', clock: 1, changes: [{ path: ['vocab', 'keep'], kind: 'set' }] }), null)
})

test('masked invalid operations are excluded before accepting a later valid value', () => {
  const storage = new MemoryStorage()
  storage.setItem('masked', JSON.stringify({ ...initialProgress, vocab: { keep: 'mastered' } }))
  for (const mutation of [
    { version: 1, id: 'bad-then-hidden', clock: 1, changes: [{ path: ['vocab', 'keep'], kind: 'set', value: 'invalid-status' }] },
    { version: 1, id: 'later-valid', clock: 2, changes: [{ path: ['vocab', 'keep'], kind: 'set', value: 'review' }] },
  ]) storage.setItem(storageJournalPrefix('masked') + mutation.id, JSON.stringify(mutation))
  const state = new SharedStorage('masked', initialProgress, decodeProgress, () => storage)
  assert.equal(state.getSnapshot().value.vocab.keep, 'review')
  assert.equal(state.getSnapshot().recovered, true, 'the invalid operation was rejected, not hidden by bulk decoder repair')
  state.retry()
  assert.equal(JSON.parse(storage.getItem('masked')!).vocab.keep, 'review')
})

test('cached valid journals use one bulk schema check rather than one full-record check per row', () => {
  const storage = new MemoryStorage(), count = 1000
  for (let index = 0; index < count; index++) {
    const mutation: StorageMutation = { version: 1, id: `row-${index}`, clock: index + 1,
      changes: [{ path: ['vocab', `word-${index}`], kind: 'set', value: 'mastered' }] }
    storage.setItem(storageJournalPrefix('large') + mutation.id, JSON.stringify(mutation))
  }
  let decodes = 0
  const decode = (input: unknown) => { decodes++; return decodeProgress(input) }
  const state = new SharedStorage('large', initialProgress, decode, () => storage)
  assert.equal(Object.keys(state.getSnapshot().value.vocab).length, count)
  state.retry(); decodes = 0; state.refresh()
  assert.equal(decodes, 2, 'one raw-value decode and one combined projection decode')
  assert.equal(Object.keys(state.getSnapshot().value.vocab).length, count)
})

test('projection updates do not mutate raw inputs or journal payloads', () => {
  const base = { groups: { original: 'review' } }
  const mutations: StorageMutation[] = [
    { version: 1, id: 'replace', clock: 1, changes: [{ path: [], kind: 'set', value: { groups: { first: 'mastered' } } }] },
    { version: 1, id: 'extend', clock: 2, changes: [{ path: ['groups', 'second'], kind: 'set', value: 'review' }] },
  ]
  const original = structuredClone({ base, mutations })
  assert.deepEqual(applyStorageMutations(base, mutations), { groups: { first: 'mastered', second: 'review' } })
  assert.deepEqual({ base, mutations }, original)
})

test('explicit field deletion is retained and data keys cannot pollute object prototypes', () => {
  const previous = { groups: { keep: 'mastered', remove: 'review' } }, next = { groups: { keep: 'mastered' } }
  const changes = storageChanges(previous, next)
  const result = applyStorageMutations({ groups: { ...previous.groups, other: 'mastered' } }, [{ version: 1, id: 'delete', clock: 1, changes }])
  assert.deepEqual(result.groups, { keep: 'mastered', other: 'mastered' })
  const safe = applyStorageMutations({}, [{ version: 1, id: 'prototype', clock: 1, changes: [{ path: ['__proto__', 'polluted'], kind: 'set', value: true }] }])
  assert.equal(({} as { polluted?: boolean }).polluted, undefined)
  assert.equal(Object.hasOwn(safe, '__proto__'), true)
})
