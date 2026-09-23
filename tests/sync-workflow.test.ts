import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, chmodSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
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
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /repository_dispatch:/)
})

test('source pinning, snapshot import, all validation gates and CAS remain before commit', () => {
  const names = ['Verify successful upstream Pages run and post-deployment check', 'Rebuild and verify published study snapshot', 'Verify locked 09:00 N1 source blob', 'Materialize requested daily JSON and validated snapshot', 'Validate content', 'Unit tests', 'Build', 'Install browser', 'Browser tests', 'Commit verified content with fast-forward protection', 'Ensure verified content has a Pages deployment']
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

test('deployment recovery is gated by verified request and exact current commit, not changed data', () => {
  assert.match(workflow, /actions: write/)
  const deployment = workflow.slice(workflow.indexOf('- name: Ensure verified content has a Pages deployment'))
  assert.match(deployment, /if: steps\.gate\.outputs\.execute == 'true'/)
  assert.doesNotMatch(deployment, /steps\.commit\.outputs\.changed/)
  assert.match(deployment, /test "\$\(git rev-parse origin\/main\)" = "\$VERIFIED_COMMIT"/)
  assert.match(deployment, /r\.head_sha===process\.env\.VERIFIED_COMMIT/)
  assert.match(deployment, /execFileSync\('gh',\['workflow','run','deploy-pages\.yml'/)
})

// Execute the actual workflow decision script with a fake gh binary. No network or repository writes.
for (const scenario of [
  {name:'successful exact commit',runs:[{head_sha:'a'.repeat(40),status:'completed',conclusion:'success'}],dispatch:false},
  {name:'running exact commit',runs:[{head_sha:'a'.repeat(40),status:'in_progress',conclusion:null}],dispatch:false},
  {name:'failed exact commit even without changed data',runs:[{head_sha:'a'.repeat(40),status:'completed',conclusion:'failure'}],dispatch:true},
  {name:'missing deployment even without changed data',runs:[],dispatch:true},
  {name:'unrelated successful commit',runs:[{head_sha:'b'.repeat(40),status:'completed',conclusion:'success'}],dispatch:true},
]) {
  test(`real deployment decision: ${scenario.name}`, () => {
    const root=mkdtempSync(join(tmpdir(),'n1-deploy-decision-'))
    try {
      const input=join(root,'runs.json'), summary=join(root,'summary.md'), log=join(root,'dispatch.log')
      writeFileSync(input,JSON.stringify({workflow_runs:scenario.runs}))
      writeFileSync(summary,'')
      const gh=join(root,'gh')
      writeFileSync(gh,'#!/bin/sh\nprintf "%s\\n" "$@" > "$N1_TEST_DISPATCH_LOG"\n')
      chmodSync(gh,0o755)
      const deployment=workflow.slice(workflow.indexOf('- name: Ensure verified content has a Pages deployment'))
      const match=deployment.match(/node --input-type=module <<'NODE'\n([\s\S]*?)\n\s*NODE/)
      assert.ok(match,'actual deployment script must be testable')
      const script=match[1].replace("'/tmp/n1-deploy-runs.json'",JSON.stringify(input))
      execFileSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,PATH:`${root}:${process.env.PATH}`,VERIFIED_COMMIT:'a'.repeat(40),GITHUB_REPOSITORY:'test/n1',GITHUB_STEP_SUMMARY:summary,N1_TEST_DISPATCH_LOG:log}})
      assert.equal(existsSync(log),scenario.dispatch)
      if (scenario.dispatch) {
        assert.equal(readFileSync(log,'utf8'),'workflow\nrun\ndeploy-pages.yml\n--repo\ntest/n1\n--ref\nmain\n')
        assert.match(readFileSync(summary,'utf8'),/awaiting_deploy/)
      }
    } finally {rmSync(root,{recursive:true,force:true})}
  })
}

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
