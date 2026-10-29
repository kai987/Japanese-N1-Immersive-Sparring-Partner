import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validateContent } from './validate-content.ts'
import { validateStudySnapshot, withItStudy, type StudySnapshot } from '../src/lib/itStudy.ts'
import { reviewFocusByDate as legacyReview } from '../src/data/history-legacy.ts'
import { compoundVerbSeries } from '../src/data/compound-verbs.ts'
import { liveUnits } from '../src/data/live-reaction-units.ts'
import { liveEntryAudioReference, liveExampleAudioReference } from '../src/lib/liveIdentities.ts'
import { audioId, audioVoice, hasJapaneseText, normalizeAudioText, splitAudioSentences } from '../src/lib/audioText.ts'

export function collectAudio() {
  const entries = new Map<string, { id: string; text: string; label: string; references: string[] }>()
  const add = (text: string | undefined, reference: string, reading?: string) => {
    if (!text?.trim()) return
    const spoken = normalizeAudioText(reading || text)
    if (!/[\p{L}\p{N}]/u.test(spoken)) return
    const id = audioId(spoken), previous = entries.get(id)
    if (previous && previous.text !== spoken) throw new Error(`Audio hash collision at ${reference}`)
    if (previous) { if (!previous.references.includes(reference)) previous.references.push(reference); return }
    entries.set(id, { id, text: spoken, label: text, references: [reference] })
  }
  const sentences = (text: string | undefined, reference: string, japaneseOnly = false) => {
    splitAudioSentences(text ?? '').forEach((sentence, index) => {
      if (!japaneseOnly || hasJapaneseText(sentence)) add(sentence, `${reference}/${index}`)
    })
  }
  const catalog = validateContent()
  const snapshot = validateStudySnapshot(JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json', import.meta.url), 'utf8')) as StudySnapshot)
  const lessons = catalog.lessons.map(item => withItStudy(item, snapshot))
  const reviews = { ...legacyReview, ...Object.fromEntries(catalog.generated.map(item => [item.lesson.date, item.reviewFocus ?? []])) }
  for (const lesson of lessons) {
    const ref = `lesson/${lesson.date}`
    add(lesson.title, `${ref}/title`)
    add(lesson.immersion.title, `${ref}/immersion/title`)
    lesson.immersion.paragraphs.forEach((text, index) => sentences(text, `${ref}/immersion/${index}`))
    add(lesson.reading.title, `${ref}/reading/title`)
    lesson.reading.paragraphs.forEach((text, index) => sentences(text, `${ref}/reading/${index}`))
    sentences(lesson.reading.question.prompt, `${ref}/question`)
    lesson.reading.question.options.forEach((text, index) => sentences(text, `${ref}/option/${index}`))
    sentences(lesson.reading.question.explanation, `${ref}/explanation`, true)
    lesson.reading.question.optionNotes.forEach((text, index) => sentences(text, `${ref}/option-note/${index}`, true))
    for (const item of lesson.vocabulary) {
      add(item.word, `${ref}/vocabulary/${item.id}/word`, item.reading)
      sentences(item.example, `${ref}/vocabulary/${item.id}/example`)
      item.collocations.forEach((text, index) => add(text, `${ref}/vocabulary/${item.id}/collocation/${index}`))
      sentences(item.reviewEvidence?.excerpt, `${ref}/vocabulary/${item.id}/evidence`)
    }
    for (const item of lesson.grammar) {
      add(item.pattern, `${ref}/grammar/${item.id}/pattern`)
      sentences(item.example, `${ref}/grammar/${item.id}/example`)
      sentences(item.reviewEvidence?.excerpt, `${ref}/grammar/${item.id}/evidence`)
    }
    reviews[lesson.date]?.forEach((item, index) => {
      sentences(item.title, `${ref}/review/${index}/title`, true)
      sentences(item.detail, `${ref}/review/${index}/detail`, true)
    })
  }
  for (const series of compoundVerbSeries) for (const group of series.groups) for (const entry of group.words) {
    const ref = `compound/${series.id}/${entry.word}`
    add(entry.word, `${ref}/word`, entry.reading)
    sentences(entry.example, `${ref}/example`)
  }
  for (const unit of liveUnits) for (const group of unit.groups) {
    const ref = `live/${unit.id}/${group.id}`
    if (group.source?.readAloud !== false) sentences(group.source?.quote, `${ref}/source`)
    group.entries.forEach(item => add(item.expression, `${ref}/${liveEntryAudioReference(item)}`, item.reading))
    group.examples.forEach(item => sentences(item.japanese, `${ref}/${liveExampleAudioReference(item)}`))
  }
  return { version: 1, voice: audioVoice, lessonDates: lessons.map(item => item.date), entries: [...entries.values()] }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = collectAudio()
  const destination = process.argv[2] ?? '/tmp/n1-audio-plan.json'
  writeFileSync(destination, JSON.stringify(catalog, null, 2) + '\n')
  console.log(`${catalog.entries.length} unique clips across ${catalog.entries.reduce((sum, entry) => sum + entry.references.length, 0)} uses / ${catalog.lessonDates.length} lessons -> ${destination}`)
}
