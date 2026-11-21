import type { ClientAudioScope } from './audioClientTypes.ts'
import { ResourceRequestError } from './resourceRecovery.ts'

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
export function decodeAudioScope(value: unknown, scope: string): ClientAudioScope {
  if (!isRecord(value) || value.version !== 1 || value.scope !== scope || !isRecord(value.clips)) throw new Error('Unexpected audio metadata')
  for (const [id, clip] of Object.entries(value.clips)) {
    if (!/^[a-f0-9]{16}$/.test(id) || !isRecord(clip) || !['daily', 'supabase', 'local'].includes(String(clip.provider))
      || typeof clip.path !== 'string' || !clip.path || typeof clip.duration !== 'number' || !Number.isFinite(clip.duration) || clip.duration <= 0) {
      throw new Error('Invalid audio recording metadata')
    }
  }
  return value as unknown as ClientAudioScope
}

/** Immutable per-scope metadata; failures are evicted so explicit retries can recover. */
export function createAudioScopeLoader(urls: Record<string, string>, fetchImpl: typeof fetch = fetch) {
  const cache = new Map<string, ClientAudioScope>(), pending = new Map<string, Promise<ClientAudioScope>>()
  return {
    get(scope: string) { return cache.get(scope) },
    load(scope: string): Promise<ClientAudioScope> {
      const cached = cache.get(scope)
      if (cached) return Promise.resolve(cached)
      const url = urls[scope]
      if (!url) return Promise.reject(new Error('Unknown audio metadata scope'))
      let request = pending.get(scope)
      if (!request) {
        request = fetchImpl(url, { cache: 'no-cache' }).then(response => {
          if (!response.ok) throw new ResourceRequestError('Audio metadata', response.status)
          return response.json() as Promise<unknown>
        }).then(value => {
          const decoded = decodeAudioScope(value, scope)
          cache.set(scope, decoded)
          return decoded
        }).finally(() => { pending.delete(scope) })
        pending.set(scope, request)
      }
      return request
    },
  }
}
