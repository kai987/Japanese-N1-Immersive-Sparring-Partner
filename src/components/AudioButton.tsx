import { memo, useSyncExternalStore, type ReactNode } from 'react'
import { audioId, hasJapaneseText, splitAudioSentences } from '../lib/audioText'
import { audioPlaybackUrl, hostedRecording, audioAvailability } from '../lib/audioClient'
import { audioStatus, subscribeAudio, toggleAudio } from '../lib/audioPlayer'

const idle = () => 'idle' as const
export const AudioButton = memo(function AudioButton({ text, speechText }: { text: string; speechText?: string }) {
  const id = audioId(speechText || text)
  const recording = hostedRecording(id)
  const status = useSyncExternalStore(subscribeAudio, () => audioStatus(id), idle)
  const duration = recording?.duration ?? audioAvailability.clips[id]?.duration ?? 0
  const available = duration > 0
  const busy = status === 'loading'
  const active = busy || status === 'playing'
  const action = active ? '一時停止' : status === 'paused' ? '再開' : status === 'error' ? '再試行' : '再生'
  return <span className={'audio-control' + (available ? '' : ' audio-unavailable')}>
    <button type="button" className={`audio-play-button ${status}`} data-audio-id={id} data-audio-duration={duration} data-audio-provider={recording?.provider ?? 'local'}
      disabled={!available} aria-label={available ? `${text}を${action}` : `${text}の音声は準備中です`} aria-pressed={active} aria-busy={busy}
      title={available ? `${action} · AivisSpeech / morioki（ノーマル）` : '音声は準備中です'}
      onClick={event => { event.stopPropagation(); void toggleAudio(id, audioPlaybackUrl(id, import.meta.env.BASE_URL)) }}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {busy ? <circle className="audio-loading-ring" cx="12" cy="12" r="7" strokeDasharray="30 14" /> : active ? <><path d="M8 6v12M16 6v12" strokeWidth="3" /></> : <><path d="m11 4-5 4H3v8h3l5 4V4Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></>}
      </svg>
    </button>
    {!available ? <span className="audio-pending-label">待配音</span> : null}
    {status === 'error' ? <span className="audio-play-error" role="status">音声を読み込めません。ボタンで再試行できます。</span> : null}
  </span>
})

export function SentenceAudio({ text, renderText = plainText, japaneseOnly = false }: { text: string; renderText?: (text: string) => ReactNode; japaneseOnly?: boolean }) {
  return <>{splitAudioSentences(text).map((sentence, index) => {
    const speak = !japaneseOnly || hasJapaneseText(sentence)
    return <span className={`spoken-sentence ${speak ? 'has-audio' : ''}`} key={`${index}-${sentence}`}><span className="spoken-text">{renderText(sentence)}</span>{speak ? <AudioButton text={sentence} /> : null}</span>
  })}</>
}
function plainText(text: string) { return text }
