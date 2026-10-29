import type { Decoded } from './progress.ts'
import { applyStorageMutations, decodeStorageMutation, stableValue, storageChanges, storageJournalPrefix, type StorageMutation } from './storageMerge.ts'

export interface StorageLike { readonly length: number; key(index: number): string | null; getItem(key: string): string | null; setItem(key: string, value: string): void }
type Snapshot<T> = { value: T; failed: boolean; recovered: boolean }
const actor = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
let clock = 0

export function readStorageMutations(storage: StorageLike, key: string): StorageMutation[] {
  const prefix = storageJournalPrefix(key), result: StorageMutation[] = []
  // Snapshot key names first: another tab may append while this tab is reading.
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((name): name is string => !!name?.startsWith(prefix))
  for (const name of keys) {
    const text = storage.getItem(name)
    if (!text) continue
    try { const mutation = decodeStorageMutation(JSON.parse(text)); if (mutation) result.push(mutation) } catch { /* An interrupted/foreign journal entry is not a replacement for valid records. */ }
  }
  return result
}

/** Exported for isolated tests and for local backup operations; no remote storage. */
export class SharedStorage<T> {
  private snapshot: Snapshot<T>
  private pending: StorageMutation[] = []
  private listeners = new Set<() => void>()
  private connections = 0
  private disconnectEvents: (() => void) | undefined
  private rejectedMutations = new Set<string>()
  private checkedMutations = new Map<string, { encoded: string; valid: boolean }>()
  readonly key: string
  private initial: T
  private decode: (input: unknown) => Decoded<T>
  private storage: () => StorageLike
  constructor(key: string, initial: T, decode: (input: unknown) => Decoded<T>, storage: () => StorageLike = () => window.localStorage) {
    this.key = key; this.initial = initial; this.decode = decode; this.storage = storage
    this.snapshot = { value: initial, failed: false, recovered: false }
    this.refresh(false)
  }
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private publish(next: Snapshot<T>) {
    if (stableValue(next) === stableValue(this.snapshot)) return
    this.snapshot = next
    this.listeners.forEach(listener => listener())
  }
  private read(storage: StorageLike): { value: T; recovered: boolean } {
    let value = this.initial, recovered = false
    const text = storage.getItem(this.key)
    if (text !== null) {
      try { const parsed = this.decode(JSON.parse(text)); value = parsed.value; recovered = parsed.recovered }
      catch { recovered = true }
    }
    const mutations = [...new Map([...readStorageMutations(storage, this.key), ...this.pending].map(item => [item.id, item])).values()]
      .sort((a, b) => a.clock - b.clock || a.id.localeCompare(b.id))
    let accepted: StorageMutation[] = []
    const reject = (mutation: StorageMutation) => {
      if (!this.rejectedMutations.has(mutation.id)) recovered = true
      this.rejectedMutations.add(mutation.id)
    }
    const validOn = (base: T, mutation: StorageMutation) => {
      try { return !this.decode(applyStorageMutations(base, [mutation])).recovered } catch { return false }
    }
    for (const mutation of mutations) {
      const encoded = JSON.stringify(mutation)
      let checked = this.checkedMutations.get(mutation.id)
      if (checked?.encoded !== encoded) {
        // Most edits affect one item. Validate that small edit against the empty
        // schema once, rather than walking the full saved record per journal row.
        checked = { encoded, valid: validOn(this.initial, mutation) }
        this.checkedMutations.set(mutation.id, checked)
      }
      if (checked.valid || validOn(applyStorageMutations(value, accepted), mutation)) accepted.push(mutation)
      else reject(mutation)
    }
    let parsed: Decoded<T>
    try {
      parsed = this.decode(applyStorageMutations(value, accepted))
      if (parsed.recovered) throw new Error('Context-dependent invalid operation')
    } catch {
      // Generic decoders may have cross-field rules. Rare invalid input takes
      // the slower chronological path, preserving the last valid projection.
      accepted = []
      let probe = value
      for (const mutation of mutations) {
        try {
          const candidate = this.decode(applyStorageMutations(probe, [mutation]))
          if (candidate.recovered) throw new Error('Invalid learning-record operation')
          probe = candidate.value; accepted.push(mutation)
        } catch { reject(mutation) }
      }
      parsed = this.decode(applyStorageMutations(value, accepted))
    }
    // A corrupt, later-masked operation must not advance the durable clock.
    for (const mutation of accepted) clock = Math.max(clock, mutation.clock)
    return { value: parsed.value, recovered: recovered || parsed.recovered }
  }
  refresh = (write = true, forceProbe = false) => {
    try {
      const storage = this.storage()
      if (write) {
        while (this.pending.length) {
          const next = this.pending[0]
          storage.setItem(storageJournalPrefix(this.key) + next.id, JSON.stringify(next))
          this.pending.shift()
        }
      }
      const result = this.read(storage)
      const serialized = JSON.stringify(result.value)
      if (write && (forceProbe || storage.getItem(this.key) !== serialized)) storage.setItem(this.key, serialized)
      this.publish({ value: result.value, failed: write ? false : this.snapshot.failed, recovered: this.snapshot.recovered || result.recovered })
    } catch {
      this.publish({ ...this.snapshot, failed: true })
    }
  }
  update = (next: T | ((previous: T) => T)) => {
    // Diff against what this tab displayed, so a stale tab cannot overwrite an
    // unrelated edit, nor reinterpret a user's visible toggle after a remote edit.
    const desired = typeof next === 'function' ? (next as (previous: T) => T)(this.snapshot.value) : next
    const changes = storageChanges(this.snapshot.value, desired)
    if (!changes.length) return
    // Observe durable clocks without changing the visible-state diff. This also
    // orders a later action correctly after a background tab or clock rollback.
    try {
      const observed = this.read(this.storage())
      if (observed.recovered) this.publish({ ...this.snapshot, recovered: true })
    } catch { /* Retain the action in memory if storage is unavailable. */ }
    clock = Math.max(Date.now() * 1000, clock + 1)
    this.pending.push({ version: 1, id: `${clock.toString(36)}-${actor}`, clock, changes })
    this.publish({ ...this.snapshot, value: desired })
    this.refresh(true)
  }
  retry = () => this.refresh(true, true)
  dismiss = () => this.publish({ ...this.snapshot, recovered: false })
  connect = () => {
    this.connections++
    if (this.connections === 1 && typeof window !== 'undefined') {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === this.key || event.key.startsWith(storageJournalPrefix(this.key))) this.refresh(true)
      }
      const onVisible = () => { if (document.visibilityState === 'visible') this.refresh(true) }
      window.addEventListener('storage', onStorage)
      window.addEventListener('focus', this.retry)
      document.addEventListener('visibilitychange', onVisible)
      this.disconnectEvents = () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('focus', this.retry)
        document.removeEventListener('visibilitychange', onVisible)
      }
      this.refresh(true, true)
    }
    return () => { if (--this.connections === 0) { this.disconnectEvents?.(); this.disconnectEvents = undefined } }
  }
}

const stores = new Map<string, SharedStorage<unknown>>()
export function sharedStorage<T>(key: string, initial: T, decode: (input: unknown) => Decoded<T>): SharedStorage<T> {
  let store = stores.get(key)
  if (!store) { store = new SharedStorage(key, initial, decode) as SharedStorage<unknown>; stores.set(key, store) }
  return store as SharedStorage<T>
}
