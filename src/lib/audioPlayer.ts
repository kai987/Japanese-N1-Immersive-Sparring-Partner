export type AudioPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'
let currentId: string | null = null
let status: AudioPlaybackStatus = 'idle'
let media: HTMLAudioElement | null = null
let revision = 0
const listeners = new Set<() => void>()
const notify = (next: AudioPlaybackStatus) => { status = next; listeners.forEach(listener => listener()) }
export const subscribeAudio = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const audioStatus = (id: string): AudioPlaybackStatus => currentId === id ? status : 'idle'

export function stopAudio() {
  if (currentId === null && status === 'idle' && !media?.getAttribute('src')) return
  revision++
  if (media) {
    media.pause()
    media.removeAttribute('src')
    media.load()
  }
  currentId = null
  notify('idle')
}

export async function toggleAudio(id: string, url: string) {
  if (currentId === id && media && (status === 'playing' || status === 'loading')) {
    revision++
    media.pause()
    notify('paused')
    return
  }
  const resume = currentId === id && media && status === 'paused'
  if (!resume) {
    stopAudio()
    media ??= Object.assign(document.createElement('audio'), { preload: 'none', hidden: true })
    if (!media.isConnected) { media.dataset.studyAudio = ''; media.setAttribute('aria-hidden', 'true'); document.body.append(media) }
    media.src = url
  }
  const player = media!
  currentId = id
  const request = ++revision
  const active = () => request === revision && currentId === id
  player.onplaying = () => { if (active()) notify('playing') }
  player.onpause = () => { if (active() && !player.ended && !player.error && status !== 'error') notify('paused') }
  player.onended = () => { if (active()) { player.currentTime = 0; notify('idle') } }
  player.onerror = () => { if (active() && player.error) notify('error') }
  notify('loading')
  try { await player.play(); if (active()) notify('playing') }
  catch { if (active()) notify('error') }
}

if (import.meta.hot) import.meta.hot.dispose(() => { stopAudio(); media?.remove(); media = null })
