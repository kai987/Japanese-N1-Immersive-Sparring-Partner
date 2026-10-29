import type { collectAudio } from '../collect-audio.ts'
import type { Clip, Manifest } from '../validate-audio.ts'
import { audioId } from '../../src/lib/audioText.ts'

type Catalog = ReturnType<typeof collectAudio>
export type NonLessonSnapshot = Record<string, string>
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const isNonLessonReference = (value: string) => /^(?:live|compound)\/[^/]+\/.+$/u.test(value) && !/[\u0000-\u001f]/u.test(value)
const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key)

function addBinding(snapshot: NonLessonSnapshot, reference: string, id: string) {
  if (!isNonLessonReference(reference)) throw new Error(`Invalid non-lesson audio reference: ${reference}`)
  if (hasOwn(snapshot, reference) && snapshot[reference] !== id) throw new Error(`Published audio reference changed identity: ${reference}`)
  snapshot[reference] = id
}

/** One-time migration from the references of already verified published clips. */
export function createNonLessonSnapshot(manifest: Pick<Manifest, 'clips'>): NonLessonSnapshot {
  const snapshot: NonLessonSnapshot = {}
  for (const [id, clip] of Object.entries(manifest.clips)) {
    if (!/^[a-f0-9]{16}$/.test(id) || clip.id !== id || audioId(clip.text) !== id) throw new Error(`Invalid published audio identity: ${id}`)
    for (const reference of clip.references) if (!reference.startsWith('lesson/')) addBinding(snapshot, reference, id)
  }
  return Object.fromEntries(Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b)))
}

/** The optional explicit snapshot never weakens a legacy manifest's strictness. */
export function validateNonLessonSnapshot(manifest: Manifest): void {
  if (manifest.nonLessonSnapshot === undefined) return
  const snapshot: unknown = manifest.nonLessonSnapshot
  if (!isRecord(snapshot)) throw new Error('Invalid non-lesson audio snapshot')
  for (const [reference, id] of Object.entries(snapshot)) {
    if (!isNonLessonReference(reference) || typeof id !== 'string' || !/^[a-f0-9]{16}$/.test(id)) throw new Error(`Invalid non-lesson audio snapshot binding: ${reference}`)
    const clip = manifest.clips[id]
    if (!clip || clip.id !== id || audioId(clip.text) !== id) throw new Error(`Non-lesson audio snapshot has no published recording: ${reference}`)
  }
  // Existing published references cannot be dropped merely by clearing the map.
  for (const [reference, id] of Object.entries(createNonLessonSnapshot(manifest))) {
    if (snapshot[reference] !== id) throw new Error(`Published non-lesson audio reference is not protected: ${reference}`)
  }
}

/** Advance only after the caller has verified and merged the corresponding bytes. */
export function advanceNonLessonSnapshot(previous: Manifest, catalog: Catalog, nextClips: Record<string, Clip>): NonLessonSnapshot | undefined {
  if (previous.nonLessonSnapshot === undefined) return undefined
  validateNonLessonSnapshot(previous)
  const next: NonLessonSnapshot = { ...previous.nonLessonSnapshot }
  for (const [reference, id] of Object.entries(createNonLessonSnapshot({ clips: nextClips }))) addBinding(next, reference, id)
  for (const entry of catalog.entries) {
    const clip = nextClips[entry.id]
    if (!clip) continue
    if (clip.text !== entry.text || clip.id !== entry.id || audioId(entry.text) !== entry.id) throw new Error(`Current audio identity differs from its recording: ${entry.id}`)
    for (const reference of entry.references) if (!reference.startsWith('lesson/')) addBinding(next, reference, entry.id)
  }
  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)))
  validateNonLessonSnapshot({ ...previous, clips: nextClips, nonLessonSnapshot: sorted })
  return sorted
}

function validateQueuedNotes(manifest: Manifest, catalog: Catalog, missing: Catalog['entries'], pending: unknown): void {
  if (!isRecord(pending) || pending.version !== 1 || JSON.stringify(pending.voice) !== JSON.stringify(catalog.voice)
    || !Array.isArray(pending.entries) || pending.pendingClips !== pending.entries.length
    || !Number.isSafeInteger(pending.requiredClips) || Number(pending.requiredClips) < pending.entries.length) {
    throw new Error('New non-lesson audio must have a valid persisted pending queue')
  }
  const current = new Map(catalog.entries.map(entry => [entry.id, entry]))
  const queued = new Map<string, Record<string, unknown>>()
  for (const entry of pending.entries) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !/^[a-f0-9]{16}$/.test(entry.id) || typeof entry.text !== 'string'
      || audioId(entry.text) !== entry.id || !Array.isArray(entry.references) || !entry.references.length
      || entry.references.some(reference => typeof reference !== 'string') || queued.has(entry.id)) {
      throw new Error('Invalid persisted pending audio entry')
    }
    const actual = current.get(entry.id)
    if (!actual || manifest.clips[entry.id] || actual.text !== entry.text
      || entry.references.some(reference => !actual.references.includes(reference as string))) throw new Error(`Pending audio entry differs from current missing speech: ${entry.id}`)
    queued.set(entry.id, entry)
  }
  for (const entry of missing) {
    const queue = queued.get(entry.id)
    const references = entry.references.filter(reference => !reference.startsWith('lesson/'))
    if (!queue || references.some(reference => !(queue.references as string[]).includes(reference))) {
      throw new Error(`New non-lesson audio is not queued with all current references: ${entry.id}`)
    }
  }
  // requiredClips describes the queue's creation catalog. New lesson-only imports
  // may extend that catalog before the normal audio follow-up refreshes the queue.
}

/** Keep published dates/references strict while separately queued notes await audio. */
export function validateAudioCoverage(manifest: Manifest, catalog: Catalog, pending?: unknown,
  { allowIncomplete = false, requireCurrent = false } = {}): Catalog['entries'] {
  validateNonLessonSnapshot(manifest)
  const snapshot = manifest.nonLessonSnapshot
  for (const entry of catalog.entries) {
    const recording = manifest.clips[entry.id]
    if (recording && recording.text !== entry.text) throw new Error(`Current speech text differs from its recording: ${entry.id}`)
    if (snapshot) for (const reference of entry.references) {
      if (hasOwn(snapshot, reference) && snapshot[reference] !== entry.id) throw new Error(`Published audio reference changed identity: ${reference}`)
    }
  }
  const missing = catalog.entries.filter(entry => !manifest.clips[entry.id])
  const dates = new Set(manifest.lessonDates)
  const missingSnapshot = missing.filter(entry => entry.references.some(reference => reference.startsWith('lesson/')
    ? dates.has(reference.split('/')[1]) : snapshot === undefined || !isNonLessonReference(reference) || hasOwn(snapshot, reference)))
  if (!allowIncomplete && missingSnapshot.length) throw new Error(`The published audio snapshot is missing ${missingSnapshot.length} clips`)
  const newNotes = missing.filter(entry => entry.references.some(reference => !reference.startsWith('lesson/')) && !missingSnapshot.includes(entry))
  if (newNotes.length) validateQueuedNotes(manifest, catalog, newNotes, pending)
  if (requireCurrent && missing.length) throw new Error(`Current learning content is missing ${missing.length} clips; run npm run audio:generate`)
  return missing
}
