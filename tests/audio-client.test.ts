import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { audioPlaybackUrl, audioSources } from '../src/lib/audioSources.ts'
import { audioRelativePath } from '../src/lib/audioText.ts'
import { clientAudioPlaybackUrl, clientHostedRecording, type ClientAudioIndex } from '../src/lib/audioClientTypes.ts'

const slim: ClientAudioIndex = {
  version: 1, complete: audioSources.complete, verifiedAt: audioSources.verifiedAt,
  providers: audioSources.providers, pendingClips: 0, pendingByLiveUnit: {},
  clips: Object.fromEntries(Object.entries(audioSources.clips).map(([id, { provider, path, duration }]) => [id, { provider, path, duration }])),
}

test('slim browser playback index preserves every published URL and duration without verification metadata', () => {
  for (const [id, recording] of Object.entries(audioSources.clips)) {
    assert.equal(clientAudioPlaybackUrl(slim, id, '/project/'), audioPlaybackUrl(id, '/project/'))
    assert.equal(clientHostedRecording(slim, id)?.duration, recording.duration)
    assert.deepEqual(Object.keys(slim.clips[id]).sort(), ['duration', 'path', 'provider'])
  }
  assert.ok(JSON.stringify(slim).length < JSON.stringify(audioSources).length)
})

test('local generation playback remains available without claiming remote verification', () => {
  const id = 'a'.repeat(16)
  const local: ClientAudioIndex = { ...slim, complete: false, clips: { [id]: { provider: 'local', path: audioRelativePath(id), duration: 1.5 } } }
  assert.equal(clientHostedRecording(local, id), undefined)
  assert.equal(local.clips[id].duration, 1.5)
  assert.equal(clientAudioPlaybackUrl(local, id, '/project/'), '/project/' + audioRelativePath(id))
  assert.equal(clientAudioPlaybackUrl(local, 'b'.repeat(16), '/project/'), '/project/' + audioRelativePath('b'.repeat(16)))
})

test('browser player modules no longer statically import full published verification manifests', () => {
  for (const path of ['src/components/AudioButton.tsx', 'src/lib/audioClient.ts', 'src/lib/audioClientTypes.ts']) {
    const source = readFileSync(path, 'utf8')
    assert.doesNotMatch(source, /audio-sources\.json|audio-index\.json|from ['"][^'"]*audioSources['"]/)
  }
})
