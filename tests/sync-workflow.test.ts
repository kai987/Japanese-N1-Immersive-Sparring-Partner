import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { verifySyncChangedPaths } from '../scripts/verify-sync-changed-paths.mjs'

const workflow = readFileSync(new URL('../.github/workflows/sync-n1-daily.yml', import.meta.url), 'utf8')
const pages = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
const date = '2026-09-23'
const daily = `src/data/daily/${date}.json`
const snapshot = 'src/data/it-study-snapshot.json'

test('new-date request starts import without first deploying a missing lesson', () => {
  assert.match(workflow, /on:\s+push:\s+branches: \[main\]\s+paths: \['\.github\/n1-sync-request\.json'\]/)
  assert.doesNotMatch(workflow, /workflow_run:/)
  assert.match(pages, /paths-ignore: \['\.github\/n1-sync-request\.json'\]/)
})

test('source pinning, snapshot import, all validation gates and CAS remain before commit', () => {
  const names = ['Rebuild and verify published study snapshot', 'Verify locked 09:00 N1 source blob', 'Materialize requested daily JSON and validated snapshot', 'Validate content', 'Unit tests', 'Build', 'Install browser', 'Browser tests', 'Commit verified content with fast-forward protection', 'Deploy the verified content commit']
  let position = -1
  for (const name of names) {
    const next = workflow.indexOf(`- name: ${name}`, position + 1)
    assert.ok(next > position, `${name} is missing or out of order`)
    position = next
  }
  assert.match(workflow, /npm run import:study -- \/tmp\/study-index\.json/)
  assert.match(workflow, /snapshot history rollback/)
  assert.match(workflow, /test "\$\(git rev-parse origin\/main\)" = "\$\{\{ github\.sha \}\}"/)
  assert.doesNotMatch(workflow, /git push[^\n]*(?:--force| -f\b)/)
})

test('bot content commit explicitly dispatches Pages only after a verified change', () => {
  assert.match(workflow, /actions: write/)
  const deployment = workflow.slice(workflow.indexOf('- name: Deploy the verified content commit'))
  assert.match(deployment, /if: steps\.commit\.outputs\.changed == 'true'/)
  assert.match(deployment, /gh workflow run deploy-pages\.yml --repo "\$GITHUB_REPOSITORY" --ref main/)
  assert.match(deployment, /test "\$\(git rev-parse origin\/main\)" = "\$VERIFIED_COMMIT"/)
})

test('identical snapshot does not block a daily-only content commit', () => {
  assert.deepEqual(verifySyncChangedPaths(date, daily), [daily])
  assert.deepEqual(verifySyncChangedPaths(date, snapshot), [snapshot])
  assert.deepEqual(verifySyncChangedPaths(date, `${daily}\n${snapshot}`), [daily, snapshot])
})

test('content commit rejects history, source, UI, control and empty changes', () => {
  for (const path of ['src/data/daily/2026-09-22.json', 'n1-source/2026-09-23.md', 'src/App.tsx', '.github/n1-sync-request.json', '']) {
    assert.throws(() => verifySyncChangedPaths(date, path))
  }
  assert.throws(() => verifySyncChangedPaths(date, `${daily}\nn1-source/2026-09-23.md`))
  assert.throws(() => verifySyncChangedPaths('../main', daily))
})
