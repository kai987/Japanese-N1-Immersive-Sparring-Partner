import index from 'virtual:n1-audio-client'
import { clientHostedRecording, clientAudioPlaybackUrl, type ClientAudioIndex } from './audioClientTypes.ts'

export const audioAvailability = index as ClientAudioIndex
export const hostedRecording = (id: string) => clientHostedRecording(audioAvailability, id)
export const audioPlaybackUrl = (id: string, siteBase = '/') => clientAudioPlaybackUrl(audioAvailability, id, siteBase)
