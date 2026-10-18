import assert from 'node:assert/strict'
import test from 'node:test'
import { validateAudio } from '../scripts/validate-audio.ts'

test('generated recordings match their text, voice, duration, index and original file hashes', () => {
  const result = validateAudio()
  assert.ok(result.clips > 0)
  assert.ok(result.files >= result.clips || result.hosted === result.clips)
})
