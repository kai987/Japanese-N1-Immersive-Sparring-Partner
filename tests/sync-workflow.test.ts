import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, chmodSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { verifySyncChangedPaths } from '../scripts/verify-sync-changed-paths.mjs'
import { createReleaseManifest, releaseManifestName } from '../scripts/lib/deploymentVerification.mjs'

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
  assert.match(deployment, /String\(successful\.id\)/)
  assert.match(deployment, /await verifyPublishedRelease/)
  assert.match(pages, /Retain exact build verification manifest/)
  assert.match(pages, /Download this run's exact build verification manifest/)
  assert.match(pages, /node scripts\/verify-deployment\.mjs/)
  assert.doesNotMatch(pages, /target in body and title in body/)
})

test('rerunning the same Pages head replaces both named artifacts and downloads proof from that same run', () => {
  for (const name of ['Retain exact build verification manifest', 'Retain learning UI verification']) {
    const start=pages.indexOf(`- name: ${name}`)
    assert.ok(start>=0)
    const end=pages.indexOf('\n      - name:',start)
    const step=pages.slice(start,end<0?undefined:end)
    assert.match(step,/actions\/upload-artifact@/)
    assert.match(step,/overwrite: true/)
  }
  const start=pages.indexOf("- name: Download this run's exact build verification manifest")
  const end=pages.indexOf('\n      - name:',start)
  const download=pages.slice(start,end<0?undefined:end)
  assert.match(download,/name: n1-deployment-verification/)
  assert.doesNotMatch(download,/run-id:|repository:/,'download must retain its default current-run scope')
})

// Execute the actual workflow decision script with a fake gh binary. No network or repository writes.
for (const scenario of [
  {name:'successful exact commit',runs:[{id:123,head_sha:'a'.repeat(40),status:'completed',conclusion:'success'}],dispatch:false},
  {name:'running exact commit',runs:[{head_sha:'a'.repeat(40),status:'in_progress',conclusion:null}],dispatch:false},
  {name:'failed exact commit even without changed data',runs:[{head_sha:'a'.repeat(40),status:'completed',conclusion:'failure'}],dispatch:true},
  {name:'missing deployment even without changed data',runs:[],dispatch:true},
  {name:'unrelated successful commit',runs:[{head_sha:'b'.repeat(40),status:'completed',conclusion:'success'}],dispatch:true},
]) {
  test(`real deployment decision: ${scenario.name}`, () => {
    const root=mkdtempSync(join(tmpdir(),'n1-deploy-decision-'))
    try {
      const input=join(root,'runs.json'), summary=join(root,'summary.md'), log=join(root,'dispatch.log'), downloadLog=join(root,'download.log')
      writeFileSync(input,JSON.stringify({workflow_runs:scenario.runs}))
      writeFileSync(summary,'')
      const request=JSON.parse(readFileSync(new URL('../.github/n1-sync-request.json',import.meta.url),'utf8'))
      const lesson=request.daily.lesson, lessonPath='assets/fixture-lesson.json', searchPath='assets/fixture-search.json'
      const files: Record<string,string>={ 'index.html':'<script src="./assets/index.js"></script>', 'assets/index.js':'export const ready=true;',
        [lessonPath]:JSON.stringify({lesson:{date:lesson.date,day:lesson.day,title:lesson.title},reviewFocus:[]}),
        [searchPath]:JSON.stringify([{lesson:{date:lesson.date,day:lesson.day,title:lesson.title},chunks:[]}]) }
      const manifest=createReleaseManifest({files:Object.entries(files).map(([path,content])=>({path,content})),lessons:{[lesson.date]:{path:lessonPath,day:lesson.day,title:lesson.title}},latestDate:lesson.date,searchIndex:searchPath,studySnapshotCommit:request.sourceCommit,entryPoints:['assets/index.js']})
      files[releaseManifestName]=JSON.stringify(manifest,null,2)+'\n'
      const artifact=join(root,releaseManifestName)
      writeFileSync(artifact,files[releaseManifestName])
      const gh=join(root,'gh')
      writeFileSync(gh,'#!/bin/sh\nif [ "$1" = run ] && [ "$2" = download ]; then\n  printf "%s\\n" "$@" > "$N1_TEST_DOWNLOAD_LOG"\n  while [ "$#" -gt 0 ]; do\n    if [ "$1" = --dir ]; then shift; cp "$N1_TEST_RELEASE_MANIFEST" "$1/n1-release.json"; exit 0; fi\n    shift\n  done\n  exit 1\nfi\nprintf "%s\\n" "$@" > "$N1_TEST_DISPATCH_LOG"\n')
      chmodSync(gh,0o755)
      const deployment=workflow.slice(workflow.indexOf('- name: Ensure verified content has a Pages deployment'))
      const match=deployment.match(/node --input-type=module <<'NODE'\n([\s\S]*?)\n\s*NODE/)
      assert.ok(match,'actual deployment script must be testable')
      const script=match[1].replace("'/tmp/n1-deploy-runs.json'",JSON.stringify(input))
      const fakeFetch=`const fixture=${JSON.stringify(files)};globalThis.fetch=async input=>{const pathname=new URL(String(input)).pathname;const path=Object.keys(fixture).find(key=>pathname.endsWith('/'+key));return new Response(path?fixture[path]:'Missing',{status:path?200:404});};\n`
      execFileSync(process.execPath,['--input-type=module','-e',fakeFetch+script],{env:{...process.env,PATH:`${root}:${process.env.PATH}`,VERIFIED_COMMIT:'a'.repeat(40),GITHUB_REPOSITORY:'test/n1',GITHUB_STEP_SUMMARY:summary,N1_TEST_DISPATCH_LOG:log,N1_TEST_DOWNLOAD_LOG:downloadLog,N1_TEST_RELEASE_MANIFEST:artifact}})
      assert.equal(existsSync(log),scenario.dispatch)
      assert.equal(existsSync(downloadLog),scenario.name==='successful exact commit')
      if (existsSync(downloadLog)) assert.match(readFileSync(downloadLog,'utf8'),/^run\ndownload\n123\n--repo\ntest\/n1\n--name\nn1-deployment-verification\n/)
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
