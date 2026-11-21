import type { PracticeCategory, SectionId } from '../types.ts'
import { parsePracticeHash, practiceHref } from './questionReview.ts'

export interface QuestionTarget {
  date: string
  category: PracticeCategory
  questionId: string
  token: number
  retry: boolean
}

export interface AppNavigation {
  active: SectionId
  selectedDate: string
  compoundSeriesId: string
  questionTarget: QuestionTarget | null
  questionLinkError: boolean
}

const sections: readonly SectionId[] = ['today', 'immersion', 'vocabulary', 'grammar', 'reading', 'review', 'history', 'compound-verbs', 'live-reactions']

/** One parser for a fresh tab, hash navigation, and browser back/forward. */
export function parseAppNavigation(
  url: URL,
  dates: ReadonlySet<string>,
  latestDate: string,
  resolveCompound: (hash: string) => string | undefined,
): AppNavigation {
  const date = url.searchParams.get('date')
  const section = url.searchParams.get('section') as SectionId | null
  const state: AppNavigation = {
    selectedDate: date && dates.has(date) ? date : latestDate,
    active: section && sections.includes(section) ? section : 'today',
    compoundSeriesId: 'au', questionTarget: null, questionLinkError: false,
  }
  const question = parsePracticeHash(url.hash)
  if (url.hash.startsWith('#practice/')) {
    if (!question || !dates.has(question.date)) {
      state.questionLinkError = true
      return state
    }
    state.selectedDate = question.date
    state.active = question.category
    state.questionTarget = { date: question.date, category: question.category, questionId: question.id, token: 0, retry: false }
  } else {
    const series = resolveCompound(url.hash)
    if (series) { state.active = 'compound-verbs'; state.compoundSeriesId = series }
    else if (url.hash === '#live-reactions') state.active = 'live-reactions'
  }
  return state
}

/** Preserve unrelated query parameters and the established practice/live links. */
export function appNavigationUrl(current: URL, state: AppNavigation): URL {
  const url = new URL(current.href)
  const independentPage = !state.questionLinkError && (state.active === 'compound-verbs' || state.active === 'live-reactions')
  if (independentPage) {
    // These hashes already identify the page. Preserve a lesson date carried
    // from ordinary navigation without adding parameters to established links.
    if (url.searchParams.has('date')) url.searchParams.set('date', state.selectedDate)
    url.searchParams.delete('section')
  } else {
    url.searchParams.set('date', state.selectedDate)
    url.searchParams.set('section', state.active)
  }
  if (url.hash.startsWith('#practice/') && state.questionLinkError) {
    // Keep a broken incoming link inspectable until the learner chooses a page,
    // including when the URL also carries a previous live/compound section.
  } else if (state.active === 'compound-verbs') url.hash = `compound-verbs/${state.compoundSeriesId}`
  else if (state.active === 'live-reactions') url.hash = 'live-reactions'
  else if (state.questionTarget && state.questionTarget.date === state.selectedDate && state.questionTarget.category === state.active) {
    url.hash = practiceHref(state.selectedDate, state.questionTarget.category, state.questionTarget.questionId)
  } else if (url.hash === '#live-reactions' || url.hash.startsWith('#compound-verbs') || url.hash.startsWith('#practice/')) url.hash = ''
  return url
}
