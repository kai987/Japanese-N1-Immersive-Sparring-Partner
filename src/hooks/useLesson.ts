import { useEffect, useState } from 'react'
import { getCachedLesson, loadLesson, lesson as latestLesson, historyItems } from '../data/history'
import { isExpiredResource } from '../lib/resourceRecovery'

export function useLesson(date: string) {
  const target = historyItems.some(item => item.date === date) ? date : latestLesson.date
  const [state, setState] = useState(() => ({ date: target, payload: getCachedLesson(latestLesson.date)!, error: null as unknown }))
  const [retry, setRetry] = useState(0)
  const cached = getCachedLesson(target)
  useEffect(() => {
    let active = true
    if (cached) { setState({ date: target, payload: cached, error: null }); return }
    setState(previous => ({ ...previous, date: target, error: null }))
    void loadLesson(target).then(payload => { if (active) setState({ date: target, payload, error: null }) },
      error => { if (active) setState(previous => ({ ...previous, date: target, error })) })
    return () => { active = false }
  }, [target, retry])
  return { payload: cached ?? state.payload, loading: !cached && !(state.date === target && state.error !== null),
    failed: !cached && state.date === target && state.error !== null,
    expired: !cached && state.date === target && isExpiredResource(state.error), retry: () => setRetry(value => value + 1) }
}
