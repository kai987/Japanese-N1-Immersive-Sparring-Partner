export type SectionId = 'today' | 'immersion' | 'vocabulary' | 'grammar' | 'reading' | 'review' | 'history'
export type ReadingMode = 'japanese' | 'bilingual' | 'analysis'
export type LearningStatus = 'new' | 'review' | 'mastered'

export interface VocabularyItem {
  id: string
  word: string
  reading: string
  meaning: string
  jlpt: 'N1'
  partOfSpeech: string
  example: string
  translation: string
  collocations: string[]
  nuance: string
}

export interface GrammarItem {
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
  reading: {
    title: string
    paragraphs: string[]
    question: ReadingQuestion
  }
}

export interface StoredProgress {
  vocab: Record<string, LearningStatus>
  grammar: Record<string, LearningStatus>
  readingAnswers: Record<string, number>
  completedSections: SectionId[]
  streak: number
  minutesThisWeek: number
}
