import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const AUDIO_TIME_ZONE = 'Asia/Tokyo'
export const AUDIO_CHECK_TIMES = Array.from({ length: 9 }, (_, index) => {
  const minutes = 11 * 60 + 10 + index * 15
  return { hour: Math.floor(minutes / 60), minute: minutes % 60 }
})
export interface AudioScheduleState { version?: 1; claimedDate?: string; reason?: string; startedAt?: string }

export function readAudioSchedule(root: string): AudioScheduleState {
  let text: string
  try { text = readFileSync(join(root, 'schedule.json'), 'utf8') }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}; throw error }
  const state: unknown = JSON.parse(text)
  // A damaged daily latch must not silently permit a second run.
  if (!state || typeof state !== 'object' || !('version' in state) || state.version !== 1
    || !('claimedDate' in state) || typeof state.claimedDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(state.claimedDate)) {
    throw new Error('Invalid audio schedule checkpoint; preserve it for inspection')
  }
  return state as AudioScheduleState
}

export function audioSchedule(now = new Date(), state: AudioScheduleState = {}) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: AUDIO_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = (type: string) => parts.find(part => part.type === type)!.value
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const minute = Number(get('hour')) * 60 + Number(get('minute'))
  // 13:10 is the final check minute. Stop at its end, including in-flight work.
  const deadline = new Date(`${date}T13:11:00+09:00`)
  const todayOpening = new Date(`${date}T11:10:00+09:00`)
  const tomorrowOpening = new Date(todayOpening.getTime() + 24 * 60 * 60_000)
  const reason = minute < 11 * 60 + 10 || minute > 13 * 60 + 10 ? 'outside_window'
    : state.claimedDate === date ? 'already_checked_today' : null
  return { date, allowed: reason === null, reason, deadline,
    nextOpening: now < todayOpening && state.claimedDate !== date ? todayOpening : tomorrowOpening }
}

const resumablePhases = new Set(['waiting_daily_audio', 'generating', 'uploading', 'validating', 'pushing', 'awaiting_deploy'])
export function unfinishedAudio(state: Record<string, unknown>): boolean {
  if (state.phase === 'complete') return false
  return state.jobPending === true || resumablePhases.has(String(state.phase))
    || (state.phase === 'retry_pending' && resumablePhases.has(String(state.failedPhase)))
}

export function audioWorkReason(state: Record<string, unknown>, date: string, lessonDates: string[], missing: number, baseCommit: string): string | null {
  if (unfinishedAudio(state)) return 'resume_pending'
  if (missing > 0) return 'missing_audio'
  if (lessonDates.includes(date) && state.lastVerifiedCommit !== baseCommit) return 'today_lesson'
  return null
}
