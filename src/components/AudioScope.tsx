import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { audioScopes } from '../lib/audioClient'
import type { ClientAudioScope, ClientRecording } from '../lib/audioClientTypes'
import { isExpiredResource, reloadWithSearch } from '../lib/resourceRecovery'

const emptyClips: Record<string, ClientRecording> = {}
const Context = createContext({ clips: emptyClips, loading: false, failed: false })

/** The daily page, live unit and compound series fetch only their own recording metadata. */
export function AudioScope({ scope, searchQuery, children }: { scope?: string; searchQuery?: string; children: ReactNode }) {
  const [state, setState] = useState<{ scope?: string; value?: ClientAudioScope; failed: boolean; expired?: boolean }>({ scope, failed: false })
  const [retry, setRetry] = useState(0)
  const cached = scope ? audioScopes.get(scope) : undefined
  useEffect(() => {
    let active = true
    if (!scope || cached) return
    setState({ scope, failed: false })
    void audioScopes.load(scope).then(value => { if (active) setState({ scope, value, failed: false }) },
      error => { if (active) setState({ scope, failed: true, expired: isExpiredResource(error) }) })
    return () => { active = false }
  }, [scope, retry, cached])
  const value = cached ?? (state.scope === scope ? state.value : undefined)
  const failed = !!scope && !value && state.scope === scope && state.failed
  const loading = !!scope && !value && !failed
  const context = useMemo(() => ({ clips: value?.clips ?? emptyClips, loading, failed }), [value, loading, failed])
  return <Context.Provider value={context}>
    {failed ? <div className="storage-notice" role="status"><p>{state.expired
      ? '音声情報が更新されています。ページを更新して続けられます。'
      : '音声情報を読み込めませんでした。教材はそのまま学習できます。'}</p>
      {state.expired ? <button className="text-btn" onClick={() => reloadWithSearch(searchQuery)}>ページを更新</button>
        : <button className="text-btn" onClick={() => setRetry(count => count + 1)}>音声情報を再読み込み</button>}</div> : null}
    {children}
  </Context.Provider>
}

export function useAudioRecording(id: string) {
  const { clips, loading, failed } = useContext(Context)
  return { recording: clips[id], loading, failed }
}
