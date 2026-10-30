import { expect, type Locator, type Page } from '@playwright/test'
import { audioPlaybackUrl } from '../../src/lib/audioSources.ts'

type Sample = {
  sequence: number; event: string; source: string; time: number; readyState: number
  paused: boolean; error: number | null; activeIds: string[]
}
type ObservedWindow = Window & { n1TestPlayback: { sequence: number; samples: Sample[] } }

/** Observe native media events, without replacing play(), requests or the player. */
export async function observeAudioPlayback(page: Page) {
  await page.addInitScript(() => {
    const state = { sequence: 0, samples: [] as Sample[] }
    ;(window as unknown as ObservedWindow).n1TestPlayback = state
    const record = (event: Event) => {
      const audio = event.target
      if (!(audio instanceof HTMLAudioElement) || !audio.matches('audio[data-study-audio]')) return
      state.samples.push({ sequence: ++state.sequence, event: event.type, source: audio.currentSrc || audio.src,
        time: audio.currentTime, readyState: audio.readyState, paused: audio.paused,
        error: audio.error?.code ?? null,
        activeIds: Array.from(document.querySelectorAll('[data-audio-id][aria-pressed="true"]'))
          .map(button => button.getAttribute('data-audio-id')!),
      })
      if (state.samples.length > 256) state.samples.shift()
    }
    for (const event of ['playing', 'timeupdate', 'pause', 'ended', 'error', 'emptied']) {
      document.addEventListener(event, record, true)
    }
  })
}

export const playbackMarker = (page: Page) => page.evaluate(() => (window as unknown as ObservedWindow).n1TestPlayback.sequence)
export const playbackSamplesAfter = (page: Page, after: number) => page.evaluate(sequence =>
  (window as unknown as ObservedWindow).n1TestPlayback.samples.filter(sample => sample.sequence > sequence), after)

export async function playbackProof(page: Page, id: string, after: number) {
  const source = audioPlaybackUrl(id)
  return page.evaluate(({ id, source, after }) => {
    const samples = (window as unknown as ObservedWindow).n1TestPlayback.samples
      .filter(sample => sample.sequence > after && sample.source === source)
    for (const sample of samples) {
      if (sample.paused || sample.error !== null || sample.readyState < 2 || sample.time <= .04 || !sample.activeIds.includes(id)) continue
      const initial = samples.find(earlier => earlier.sequence < sample.sequence && earlier.time < sample.time)
      if (initial) return { ...sample, initialTime: initial.time }
    }
    return undefined
  }, { id, source, after })
}

/** A new click/resume needs new, advancing, error-free evidence for that exact URL. */
export async function recordedPlayback(page: Page, id: string, after: number) {
  await expect(page.locator('audio[data-study-audio]')).toHaveCount(1)
  let proof: (Sample & { initialTime: number }) | undefined
  await expect.poll(async () => {
    proof = await playbackProof(page, id, after)
    return !!proof
  }, { message: `Real playback must advance for ${id} after click ${after}` }).toBe(true)
  return proof!
}

export async function playRecording(page: Page, button: Locator) {
  const id = await button.getAttribute('data-audio-id')
  if (!id) throw new Error('The real audio button has no recording identity')
  const after = await playbackMarker(page)
  await button.click()
  return recordedPlayback(page, id, after)
}
