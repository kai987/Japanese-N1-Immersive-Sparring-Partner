import sources from '../data/audio-sources.json' with { type: 'json' }
import { audioRelativePath } from './audioText.ts'

export type HostedRecording = { provider: 'daily' | 'supabase'; path: string; sha256: string; bytes: number; duration: number }
export type AudioSources = {
  version: number; complete: boolean; verifiedAt?: string
  voice: Record<string, string | number>; modelVersion: string
  sharedSource: { repository: string; commit: string }
  providers: { daily: string; supabase: string }
  summary: { total: number; reused: number; uploads: number; savedBytes: number; uploadBytes: number }
  clips: Record<string, HostedRecording>
}
export const audioSources = sources as AudioSources
export function hostedRecording(id: string): HostedRecording | undefined {
  return audioSources.complete ? audioSources.clips[id] : undefined
}
export function audioPlaybackUrl(id: string, siteBase = '/') {
  const recording = hostedRecording(id)
  return recording ? new URL(recording.path, audioSources.providers[recording.provider]).href : `${siteBase}${audioRelativePath(id)}`
}
