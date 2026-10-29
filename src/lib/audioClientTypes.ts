import { audioRelativePath } from './audioText.ts'

export type ClientRecording = { provider: 'daily' | 'supabase' | 'local'; path: string; duration: number }
export interface ClientAudioIndex {
  version: 1
  complete: boolean
  verifiedAt?: string
  providers: { daily: string; supabase: string }
  clips: Record<string, ClientRecording>
  pendingClips: number
  pendingByLiveUnit: Record<string, number>
}

export function clientHostedRecording(index: ClientAudioIndex, id: string): ClientRecording | undefined {
  const recording = index.clips[id]
  return index.complete && recording?.provider !== 'local' ? recording : undefined
}
export function clientAudioPlaybackUrl(index: ClientAudioIndex, id: string, siteBase = '/'): string {
  const recording = clientHostedRecording(index, id)
  return recording && recording.provider !== 'local' ? new URL(recording.path, index.providers[recording.provider]).href : siteBase + audioRelativePath(id)
}
