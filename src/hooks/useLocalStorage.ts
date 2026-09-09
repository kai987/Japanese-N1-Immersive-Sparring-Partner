import { useEffect, useState } from 'react'
import type { Decoded } from '../lib/progress'

export function useLocalStorage<T>(key: string, initialValue: T, decode: (input: unknown) => Decoded<T>) {
  const [initial] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item === null ? { value: initialValue, recovered: false } : decode(JSON.parse(item))
    } catch {
      return { value: initialValue, recovered: true }
    }
  })
  const [value, setValue] = useState(initial.value)
  const [failed, setFailed] = useState(false)
  const [recovered, setRecovered] = useState(initial.recovered)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [key, value, retry])

  return [value, setValue, { failed, recovered, retry: () => setRetry(n => n + 1),
    dismiss: () => setRecovered(false) }] as const
}
