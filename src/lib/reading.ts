import type { ReadingQuestion } from '../types.ts'

// Rotate only the presentation. Canonical indexes keep existing saved answers valid.
export function readingChoices(question: ReadingQuestion, day: number) {
  const count = question.options.length
  const target = (day - 1) % count
  const offset = (question.answer - target + count) % count
  return question.options.map((_, displayIndex) => {
    const index = (displayIndex + offset) % count
    return { index, text: question.options[index], note: question.optionNotes[index] }
  })
}
