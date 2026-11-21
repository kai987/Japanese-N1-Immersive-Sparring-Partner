import index from 'virtual:n1-audio-client'
import assets from 'virtual:n1-data-assets'
import { createAudioScopeLoader } from './audioScopeData.ts'
import { clientAudioPlaybackUrl, type ClientRecording } from './audioClientTypes.ts'

export const audioAvailability = index
export const audioScopes = createAudioScopeLoader(assets.audioScopes)
export const audioPlaybackUrl = (id: string, recording: ClientRecording, siteBase = '/') =>
  clientAudioPlaybackUrl({ ...audioAvailability, clips: { [id]: recording } }, id, siteBase)
