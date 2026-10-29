import type { ReadingAttempt } from '../types.ts'

export interface StorageChange {
  path: string[]
  kind: 'set' | 'remove' | 'members' | 'attempts'
  value?: unknown
  add?: unknown[]
  remove?: unknown[]
  before?: ReadingAttempt[]
}
export interface StorageMutation { version: 1; id: string; clock: number; changes: StorageChange[] }
export const storageJournalPrefix = (key: string) => `n1-record-journal-v1:${encodeURIComponent(key)}:`
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key)
export const stableValue = (value: unknown): string => JSON.stringify(value, (_key, item) => record(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item)
const same = (a: unknown, b: unknown) => stableValue(a) === stableValue(b)
const counts = (values: unknown[]) => {
  const result = new Map<string, { value: unknown; count: number }>()
  for (const value of values) { const key = stableValue(value), prior = result.get(key); result.set(key, { value, count: (prior?.count ?? 0) + 1 }) }
  return result
}
const addedItems = (before: unknown[], after: unknown[]) => {
  const previous = counts(before), result: unknown[] = []
  for (const [key, item] of counts(after)) for (let n = previous.get(key)?.count ?? 0; n < item.count; n++) result.push(item.value)
  return result
}

/** Capture only the fields the user changed, never a stale tab's entire record. */
export function storageChanges(before: unknown, after: unknown, path: string[] = []): StorageChange[] {
  if (same(before, after)) return []
  if (Array.isArray(before) && Array.isArray(after)) {
    if (path[0] === 'readingAttempts' && path.length === 2) return [{ path, kind: 'attempts', before: before as ReadingAttempt[], add: addedItems(before, after) }]
    return [{ path, kind: 'members', add: addedItems(before, after), remove: addedItems(after, before) }]
  }
  if (record(before) && record(after)) return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(key => {
    if (!own(after, key)) return [{ path: [...path, key], kind: 'remove' as const }]
    if (!own(before, key)) {
      // Reading history needs append identities even for its first answer.
      if (path[0] === 'readingAttempts' && Array.isArray(after[key])) return storageChanges([], after[key], [...path, key])
      return [{ path: [...path, key], kind: 'set' as const, value: after[key] }]
    }
    return storageChanges(before[key], after[key], [...path, key])
  })
  return [{ path, kind: 'set', value: after }]
}

function at(value: unknown, path: string[]): unknown {
  let current = value
  for (const key of path) { if (!record(current) || !own(current, key)) return undefined; current = current[key] }
  return current
}
function put(value: unknown, path: string[], next: unknown, remove = false): unknown {
  const clone = (item: unknown) => item !== null && typeof item === 'object' ? structuredClone(item) : item
  if (!path.length) return clone(next)
  // applyStorageMutations owns a deep clone. Mutate that private projection
  // instead of copying every vocabulary map for every historical operation.
  const result = record(value) ? value : {}
  let parent: Record<string, unknown> = result
  for (const key of path.slice(0, -1)) {
    const child = own(parent, key) && record(parent[key]) ? parent[key] : {}
    if (!own(parent, key) || parent[key] !== child) Object.defineProperty(parent, key, { value: child, enumerable: true, configurable: true, writable: true })
    parent = child
  }
  const key = path.at(-1)!
  if (remove) delete parent[key]
  else Object.defineProperty(parent, key, { value: clone(next), enumerable: true, configurable: true, writable: true })
  return result
}
function sortAttempts(values: unknown[]): ReadingAttempt[] {
  return (values as ReadingAttempt[]).sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''))
}

/** Idempotent union used by backup imports; keep legitimate repeated legacy attempts. */
export function mergeAttemptHistory(...histories: ReadingAttempt[][]): ReadingAttempt[] {
  const result = new Map<string, { value: unknown; count: number }>()
  for (const history of histories) for (const [key, item] of counts(history)) {
    if ((result.get(key)?.count ?? 0) < item.count) result.set(key, item)
  }
  return sortAttempts([...result.values()].flatMap(item => Array.from({ length: item.count }, () => item.value)))
}

/** A unique append-only journal survives concurrent localStorage read/write races. */
export function applyStorageMutations<T>(base: T, mutations: StorageMutation[]): T {
  let value: unknown = structuredClone(base)
  const attemptChanges = new Map<string, StorageChange[]>()
  const unique = [...new Map(mutations.map(item => [item.id, item])).values()]
    .sort((a, b) => a.clock - b.clock || a.id.localeCompare(b.id))
  for (const mutation of unique) for (const change of mutation.changes) {
    if (change.kind === 'attempts') {
      const key = JSON.stringify(change.path), list = attemptChanges.get(key) ?? []
      list.push(change); attemptChanges.set(key, list)
    } else if (change.kind === 'remove') value = put(value, change.path, undefined, true)
    else if (change.kind === 'set') value = put(value, change.path, change.value)
    else {
      const old = at(value, change.path), members = new Map((Array.isArray(old) ? old : []).map(item => [stableValue(item), item]))
      for (const item of change.remove ?? []) members.delete(stableValue(item))
      for (const item of change.add ?? []) members.set(stableValue(item), item)
      value = put(value, change.path, [...members.values()])
    }
  }
  for (const [key, changes] of attemptChanges) {
    const path = JSON.parse(key) as string[], current = at(value, path), currentCounts = counts(Array.isArray(current) ? current : [])
    const signatures = new Set(changes.flatMap(change => [...counts(change.before ?? []).keys(), ...counts(change.add ?? []).keys()]))
    for (const signature of signatures) {
      const baseline = Math.min(...changes.map(change => counts(change.before ?? []).get(signature)?.count ?? 0))
      const additions = changes.reduce((total, change) => total + (counts(change.add ?? []).get(signature)?.count ?? 0), 0)
      const target = Math.max(currentCounts.get(signature)?.count ?? 0, baseline + additions)
      const example = currentCounts.get(signature)?.value ?? changes.flatMap(change => [...(change.before ?? []), ...(change.add ?? [])]).find(item => stableValue(item) === signature)
      currentCounts.set(signature, { value: example, count: target })
    }
    value = put(value, path, sortAttempts([...currentCounts.values()].flatMap(item => Array.from({ length: item.count }, () => item.value))))
  }
  return value as T
}

export function decodeStorageMutation(input: unknown): StorageMutation | null {
  if (!record(input) || input.version !== 1 || typeof input.id !== 'string' || !Number.isSafeInteger(input.clock)
    || !Array.isArray(input.changes)) return null
  for (const change of input.changes) {
    if (!record(change) || !Array.isArray(change.path) || change.path.some(key => typeof key !== 'string')
      || !['set', 'remove', 'members', 'attempts'].includes(String(change.kind))) return null
    if (change.kind === 'set' && (!own(change, 'value') || change.value === undefined)) return null
    if (change.kind === 'remove' && change.path.length === 0) return null
    if (change.kind === 'members' && (!Array.isArray(change.add) || !Array.isArray(change.remove))) return null
    if (change.kind === 'attempts') {
      if (!Array.isArray(change.before) || !Array.isArray(change.add) || change.path[0] !== 'readingAttempts' || change.path.length !== 2) return null
      for (const attempt of [...change.before, ...change.add]) if (!record(attempt) || !Number.isInteger(attempt.answer)
        || Number(attempt.answer) < 0 || Number(attempt.answer) > 3
        || !(attempt.at === null || typeof attempt.at === 'string' && Number.isFinite(Date.parse(attempt.at)))) return null
    }
  }
  return input as unknown as StorageMutation
}
