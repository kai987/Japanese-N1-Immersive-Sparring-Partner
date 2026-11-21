import assert from 'node:assert/strict'
import test from 'node:test'
import { createBrowserAudio, createBrowserAudioScopes } from '../scripts/lib/browserData.ts'
import { createAudioScopeLoader } from '../src/lib/audioScopeData.ts'
import { clientAudioPlaybackUrl } from '../src/lib/audioClientTypes.ts'

test('scoped metadata preserves every recording and leaves the initial audio summary free of playback mappings', () => {
  const original = createBrowserAudio(), { availability, byScope } = createBrowserAudioScopes()
  assert.equal(Object.hasOwn(availability, 'clips'), false)
  assert.ok(Buffer.byteLength(JSON.stringify(availability)) < 5_000)
  const restored = Object.assign({}, ...Object.values(byScope).map(scope => scope.clips))
  assert.deepEqual(restored, original.clips)
  for (const value of Object.values(byScope)) for (const id of Object.keys(value.clips)) {
    assert.equal(clientAudioPlaybackUrl({ ...availability, clips: value.clips }, id, '/project/'), clientAudioPlaybackUrl(original, id, '/project/'))
  }
  assert.ok(Object.keys(byScope).some(scope => scope.startsWith('lesson/')))
  assert.ok(Object.keys(byScope).some(scope => scope.startsWith('live/')))
  assert.ok(Object.keys(byScope).some(scope => scope.startsWith('compound/')))
  assert.ok(Object.values(byScope).filter(scope => scope.scope.startsWith('lesson/')).every(scope => Object.keys(scope.clips).length < Object.keys(original.clips).length / 8))
})

test('scope loaders request only selected metadata, share concurrent requests and reuse immutable cached results', async () => {
  const a = 'lesson/2026-09-18', b = 'live/2026-09-28', requests: string[] = []
  const loader = createAudioScopeLoader({ [a]: '/a.json', [b]: '/b.json' }, async input => {
    requests.push(String(input))
    return new Response(JSON.stringify({ version: 1, scope: input === '/a.json' ? a : b, clips: {} }))
  })
  assert.deepEqual(requests, [])
  const first = loader.load(a)
  assert.equal(loader.load(a), first)
  const result = await first
  assert.equal(await loader.load(a), result)
  assert.deepEqual(requests, ['/a.json'])
  await loader.load(b)
  assert.deepEqual(requests, ['/a.json', '/b.json'])
  await assert.rejects(loader.load('missing'), /Unknown audio/)
})

test('HTTP and invalid-payload failures clear the pending request so retry can recover', async () => {
  const scope = 'compound/au', clip = { provider: 'supabase', path: 'morioki-normal/clip.mp3', duration: 1.5 }
  const outcomes = [new Response('Unavailable', { status: 503 }),
    new Response(JSON.stringify({ version: 1, scope: 'compound/other', clips: {} })),
    new Response(JSON.stringify({ version: 1, scope, clips: { ['a'.repeat(16)]: { ...clip, duration: -1 } } })),
    new Response(JSON.stringify({ version: 1, scope, clips: { ['a'.repeat(16)]: clip } }))]
  const loader = createAudioScopeLoader({ [scope]: '/scope.json' }, async () => outcomes.shift()!)
  for (const pattern of [/503/, /Unexpected audio/, /Invalid audio/]) {
    await assert.rejects(loader.load(scope), pattern)
    assert.equal(loader.get(scope), undefined)
  }
  assert.equal((await loader.load(scope)).clips['a'.repeat(16)].duration, 1.5)
  assert.equal(outcomes.length, 0)
})
