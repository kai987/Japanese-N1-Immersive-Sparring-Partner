export type SectionId = 'today' | 'immersion' | 'vocabulary' | 'grammar' | 'reading' | 'review' | 'history'
export type ReadingMode = 'japanese' | 'bilingual' | 'analysis'
export type LearningStatus = 'new' | 'review' | 'mastered'

export interface ReportFrequency {
  appearedDays: number
  totalDays: number
  percent: number
  appearedDates: string[]
}
export interface StudyMetadata {
  studyKind?: 'new' | 'review'
  firstIntroducedDate?: string
  reportFrequency?: ReportFrequency
  reviewEvidence?: { form: string; excerpt: string; sourceKind: string }
}

export interface VocabularyItem extends StudyMetadata {
  id: string
  word: string
  reading: string
  meaning: string
  jlpt: 'N1' | 'N2' | 'N3' | 'N5/N4'
  partOfSpeech: string
  example: string
  translation: string
  collocations: string[]
  nuance: string
}

export interface GrammarItem extends StudyMetadata {
  level?: string
  sourceUrl?: string
  sourceForm?: string
  sourceAnchor?: string
  id: string
  pattern: string
  meaning: string
  form: string
  register: string
  frequency: number
  explanation: string
  example: string
  translation: string
  comparison: string
}

export interface ReadingQuestion {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
  optionNotes: string[]
}

export interface DailyLesson {
  issueNumber?: number
  studyFrequencyScope?: string
  studyVocabularyNote?: string
  studyGrammarNote?: string
  date: string
  day: number
  title: string
  subtitle: string
  estimatedMinutes: number
  immersion: {
    title: string
    paragraphs: string[]
    translations: string[]
    analysis: string[]
  }
  vocabulary: VocabularyItem[]
  grammar: GrammarItem[]
  grammarSelectionNote?: string
  grammarSourceCommit?: string
  reading: {
    title: string
    paragraphs: string[]
    question: ReadingQuestion
  }
}

export interface ReadingAttempt {
  answer: number
  at: string | null
}

export interface StoredProgress {
  version: 2
  vocab: Record<string, LearningStatus>
  grammar: Record<string, LearningStatus>
  readingAnswers: Record<string, number>
  readingAttempts: Record<string, ReadingAttempt[]>
  studyDates: string[]
}
