import { useEffect, useRef, useState } from 'react'
import { historyItems, lesson as latestLesson } from '../data/history'
import { compoundSeriesFromHash } from '../lib/compoundCatalog'
import { appNavigationUrl, parseAppNavigation, type QuestionTarget } from '../lib/appNavigation'

const lessonDates = new Set(historyItems.map(item => item.date))
const readLocation = () => parseAppNavigation(new URL(window.location.href), lessonDates, latestLesson.date, compoundSeriesFromHash)

export function useAppNavigation(onExternalNavigation: () => void) {
  const [initial] = useState(readLocation)
  const [active, setActive] = useState(initial.active)
  const [selectedDate, setSelectedDate] = useState(initial.selectedDate)
  const [compoundSeriesId, setCompoundSeriesId] = useState(initial.compoundSeriesId)
  const [questionTarget, setQuestionTarget] = useState<QuestionTarget | null>(initial.questionTarget)
  const [questionLinkError, setQuestionLinkError] = useState(initial.questionLinkError)
  const externalNavigationRef = useRef(onExternalNavigation)
  useEffect(() => { externalNavigationRef.current = onExternalNavigation }, [onExternalNavigation])

  useEffect(() => {
    const url = appNavigationUrl(new URL(window.location.href), { active, selectedDate, compoundSeriesId, questionTarget, questionLinkError })
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
  }, [active, selectedDate, compoundSeriesId, questionTarget, questionLinkError])

  useEffect(() => {
    const navigate = () => {
      const next = readLocation()
      externalNavigationRef.current()
      setActive(next.active)
      setSelectedDate(next.selectedDate)
      setCompoundSeriesId(next.compoundSeriesId)
      setQuestionLinkError(next.questionLinkError)
      setQuestionTarget(previous => next.questionTarget ? { ...next.questionTarget, token: (previous?.token ?? 0) + 1 } : null)
    }
    window.addEventListener('hashchange', navigate)
    window.addEventListener('popstate', navigate)
    return () => { window.removeEventListener('hashchange', navigate); window.removeEventListener('popstate', navigate) }
  }, [])

  return { active, setActive, selectedDate, setSelectedDate, compoundSeriesId, setCompoundSeriesId,
    questionTarget, setQuestionTarget, questionLinkError, setQuestionLinkError }
}
