import assert from 'node:assert/strict'
import test from 'node:test'
import { assertBrowserDataBudget, browserDataBudget } from '../scripts/lib/browserDataBudget.ts'

const chunk = (fileName: string, imports: string[] = [], modules = {}) => ({ type: 'chunk' as const, fileName, isEntry: fileName === 'index.js', code: 'export{}', imports, modules })
const fixture = () => ({ 'index.js': chunk('index.js', ['shared.js']), 'shared.js': chunk('shared.js'),
  'lazy.js': chunk('lazy.js', [], { '/project/src/data/live-reaction-units.ts': {} }),
  'search.json': { type: 'asset' as const, fileName: 'search.json', source: '{"version":2}' } })

test('the budget allows lazy lesson data and counts all statically reachable chunks', () => {
  const bundle = fixture()
  const result = assertBrowserDataBudget(bundle, 'search.json')
  assert.equal(result.initialJavaScript.bytes, Buffer.byteLength(bundle['index.js'].code + bundle['shared.js'].code))
  bundle['shared.js'].imports.push('lazy.js')
  assert.throws(() => assertBrowserDataBudget(bundle, 'search.json'), /Full learning data entered initial JavaScript/)
})

test('splitting an oversized entry into static chunks cannot bypass the initial transfer budget', () => {
  const bundle = fixture()
  bundle['shared.js'].code = ' '.repeat(browserDataBudget.initialJavaScript.bytes)
  assert.throws(() => assertBrowserDataBudget(bundle, 'search.json'), /Initial JavaScript exceeds/)
})
