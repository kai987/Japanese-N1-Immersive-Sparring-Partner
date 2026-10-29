import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Decoded } from '../lib/progress'
import { sharedStorage } from '../lib/sharedStorage'

export function useLocalStorage<T>(key: string, initialValue: T, decode: (input: unknown) => Decoded<T>) {
  // The store is shared by components in this window; native storage events
  // reconcile other windows. The existing value schema and keys stay intact.
  const store = useMemo(() => sharedStorage(key, initialValue, decode), [key])
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(store.connect, [store])
  return [snapshot.value, store.update, { failed: snapshot.failed, recovered: snapshot.recovered,
    retry: store.retry, dismiss: store.dismiss }] as const
}
