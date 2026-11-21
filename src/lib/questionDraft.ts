import type { ReadingAttempt, ReadingQuestion } from '../types.ts'

export interface QuestionDraft { selected: number | null; retrying: boolean }
export interface DraftStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
const keyFor = (id: string) => `n1-question-draft:${id}`
const revision = (question: ReadingQuestion, answered: number | undefined, attempts: readonly ReadingAttempt[]) =>
  JSON.stringify([question.prompt, question.options, answered ?? null, attempts.length, attempts.at(-1) ?? null])

function browserStorage(): DraftStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.sessionStorage } catch { return undefined }
}

/** Drafts are tab-local and are never submitted, scored, or added to backups. */
export function readQuestionDraft(question: ReadingQuestion, answered: number | undefined, attempts: readonly ReadingAttempt[], startRetry = false, storage = browserStorage()): QuestionDraft {
  const fallback = { selected: null, retrying: startRetry }
  try {
    const raw = storage?.getItem(keyFor(question.id))
    if (!raw) return fallback
    const draft = JSON.parse(raw)
    if (draft.version !== 1 || draft.revision !== revision(question, answered, attempts) || typeof draft.retrying !== 'boolean' ||
      !(draft.selected === null || (Number.isInteger(draft.selected) && draft.selected >= 0 && draft.selected < question.options.length))) return fallback
    if (startRetry && !draft.retrying) return fallback
    return { selected: draft.selected, retrying: startRetry || draft.retrying }
  } catch { return fallback }
}

export function saveQuestionDraft(question: ReadingQuestion, answered: number | undefined, attempts: readonly ReadingAttempt[], draft: QuestionDraft, storage = browserStorage()): void {
  try { storage?.setItem(keyFor(question.id), JSON.stringify({ version: 1, revision: revision(question, answered, attempts), ...draft })) } catch { /* Learning remains available when tab storage is blocked. */ }
}

export function clearQuestionDraft(id: string, storage = browserStorage()): void {
  try { storage?.removeItem(keyFor(id)) } catch { /* A later answer revision also invalidates this draft. */ }
}
