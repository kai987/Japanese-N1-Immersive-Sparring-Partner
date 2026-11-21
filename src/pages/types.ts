import type { ReactNode } from 'react'
import type { DailyLesson, LearningStatus, PracticeCategory, SectionId, StoredProgress } from '../types'

export interface LessonPageProps {
  lesson: DailyLesson
  highlight: (text: string) => ReactNode
  go: (section: SectionId) => void
}
export interface PracticePageProps extends LessonPageProps {
  practiceNavigation: ReactNode
  practiceContent: ReactNode
  progress: StoredProgress
  updateStatus: (kind: 'vocab' | 'grammar', id: string, status: LearningStatus) => void
}
export interface ManualReviewItem { id: string; type: string; section: SectionId; title: string; detail: string }
export type OpenQuestion = (category: PracticeCategory, id: string, retry?: boolean) => void
