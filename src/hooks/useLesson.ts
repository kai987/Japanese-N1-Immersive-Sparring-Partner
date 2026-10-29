import { useEffect, useState } from 'react'
import { getCachedLesson, loadLesson, lesson as latestLesson, historyItems } from '../data/history'

export function useLesson(date: string) {
  const target = historyItems.some(item => item.date === date) ? date : latestLesson.date
  const [state, setState] = useState(() => ({ date: target, payload: getCachedLesson(latestLesson.date)!, error: false }))
  const [retry, setRetry] = useState(0)
  const cached = getCachedLesson(target)
  useEffect(() => {
    let active = true
    if (cached) { setState({ date: target, payload: cached, error: false }); return }
    setState(previous => ({ ...previous, date: target, error: false }))
    void loadLesson(target).then(payload => { if (active) setState({ date: target, payload, error: false }) },
      () => { if (active) setState(previous => ({ ...previous, date: target, error: true })) })
    return () => { active = false }
  }, [target, retry])
  return { payload: cached ?? state.payload, loading: !cached && !(state.date === target && state.error),
    failed: !cached && state.date === target && state.error, retry: () => setRetry(value => value + 1) }
}
