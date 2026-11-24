import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, chmodSync, existsSync, rmSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'
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
  const names = ['Verify successful upstream Pages run and post-deployment check', 'Rebuild and verify published study snapshot', 'Verify locked 09:00 N1 source blob', 'Materialize requested daily JSON and validated snapshot', 'Verify study snapshot import', 'Capture candidate source tree', 'Typecheck', 'Validate content', 'Validate audio pending snapshot', 'Unit tests', 'Build', 'Install browser', 'Browser tests', 'Commit verified content with fast-forward protection', 'Seal validated build for Pages', 'Retain validated Pages build', 'Ensure verified content has a Pages deployment']
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
      execFileSync(process.execPath,['--input-type=module','-e',fakeFetch+script],{env:{...process.env,PATH:`${root}:${process.env.PATH}`,VERIFIED_COMMIT:'a'.repeat(40),GITHUB_REPOSITORY:'test/n1',GITHUB_RUN_ID:'456',GITHUB_STEP_SUMMARY:summary,N1_TEST_DISPATCH_LOG:log,N1_TEST_DOWNLOAD_LOG:downloadLog,N1_TEST_RELEASE_MANIFEST:artifact}})
      assert.equal(existsSync(log),scenario.dispatch)
      assert.equal(existsSync(downloadLog),scenario.name==='successful exact commit')
      if (existsSync(downloadLog)) assert.match(readFileSync(downloadLog,'utf8'),/^run\ndownload\n123\n--repo\ntest\/n1\n--name\nn1-deployment-verification\n/)
      if (scenario.dispatch) {
        assert.equal(readFileSync(log,'utf8'),'workflow\nrun\ndeploy-pages.yml\n--repo\ntest/n1\n--ref\nmain\n-f\nvalidated_run_id=456\n')
        assert.match(readFileSync(summary,'utf8'),/awaiting_deploy/)
      }
    } finally {rmSync(root,{recursive:true,force:true})}
  })
}

test('Pages reuses only a verified candidate and otherwise retains every full validation gate', () => {
  assert.match(pages, /validated_run_id:[\s\S]*?required: false/)
  assert.match(pages, /actions: read/)
  assert.match(pages, /fetch-depth: 2/)
  assert.match(pages, /id: reuse[\s\S]*?node scripts\/validated-build\.mjs restore/)
  for (const name of ['Install dependencies', 'Typecheck', 'Verify study snapshot import', 'Validate content', 'Validate audio pending snapshot', 'Unit tests', 'Build']) {
    const start = pages.indexOf(`- name: ${name}\n`), end = pages.indexOf('\n      - name:', start)
    assert.ok(start >= 0, `${name} must be retained`)
    assert.match(pages.slice(start, end < 0 ? undefined : end), /if: steps\.reuse\.outputs\.reused != 'true'/)
  }
  const browserJob = pages.slice(pages.indexOf('\n  browser:'), pages.indexOf('\n  deploy:'))
  assert.match(browserJob, /permissions:\s+contents: read\s+actions: read/)
  assert.match(browserJob, /needs: build\s+if: needs\.build\.outputs\.browser_validated != 'true'/)
  assert.match(pages, /shard: \[1, 2\]/)
  assert.match(pages, /needs: \[build, browser\]/)
  assert.match(pages, /needs\.browser\.result == 'success'/)
  assert.match(pages, /needs\.browser\.result == 'skipped' && needs\.build\.outputs\.browser_validated == 'true'/)
  assert.match(pages, /sha256sum --check --strict/)
  assert.match(pages, /name: \$\{\{ needs\.build\.outputs\.artifact_name \}\}/)
  assert.match(pages, /artifact_name: \$\{\{ needs\.build\.outputs\.artifact_name \}\}/)
  for (const name of ['Retain exact build verification manifest', 'Upload Pages artifact', 'Verify live target date and exact release assets']) {
    const start = pages.indexOf(`- name: ${name}\n`), end = pages.indexOf('\n      - name:', start)
    assert.ok(start >= 0)
    assert.doesNotMatch(pages.slice(start, end < 0 ? undefined : end), /steps\.reuse/)
  }
  assert.match(workflow, /name: n1-validated-build-\$\{\{ github\.run_attempt \}\}/)
  assert.match(workflow, /cmp \/tmp\/n1-imported-study\.json src\/data\/it-study-snapshot\.json/)
  for (const name of ['Seal validated build for Pages', 'Retain validated Pages build']) {
    const start = workflow.indexOf(`- name: ${name}\n`), end = workflow.indexOf('\n      - name:', start)
    assert.match(workflow.slice(start, end), /continue-on-error: true/, 'optional artifact failure must still dispatch fully checked Pages')
  }
  for (const name of ['Verify study snapshot import', 'Validate content', 'Unit tests', 'Build', 'Browser tests', 'Commit verified content with fast-forward protection']) {
    const start = workflow.indexOf(`- name: ${name}\n`), end = workflow.indexOf('\n      - name:', start)
    assert.doesNotMatch(workflow.slice(start, end), /continue-on-error/, 'existing validation and publication gates remain strict')
  }
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

const sharedAudio = readFileSync(new URL('../.github/workflows/sync-n1-audio.yml', import.meta.url), 'utf8')
const audioStep = (name: string) => {
  const start = sharedAudio.indexOf(`      - name: ${name}\n`)
  assert.ok(start >= 0, name)
  const end = sharedAudio.indexOf('\n      - name:', start)
  return sharedAudio.slice(start, end < 0 ? undefined : end)
}
const audioShell = (step: string) => step.split('        run: |\n')[1].replace(/^ {10}/gm, '')

test('shared audio sync preserves the npm failure even when tee succeeds and retains the summary', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-audio-sync-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const step = audioStep('Verify and merge shared audio, record pending utterances')
  const summary = join(root, 'summary')
  assert.match(step, /shell: bash/)
  writeFileSync(join(root, 'npm'), '#!/bin/sh\necho "fixture sync failed"\nexit 27\n', { mode: 0o755 })
  const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', audioShell(step)], {
    env: { ...process.env, PATH: `${root}:${process.env.PATH}`, RUNNER_TEMP: root, GITHUB_STEP_SUMMARY: summary },
  })
  assert.equal(result.status, 27)
  assert.match(readFileSync(summary, 'utf8'), /fixture sync failed/)
})

test('shared audio skips expensive gates only when the metadata diff is empty', t => {
  const root = mkdtempSync(join(tmpdir(), 'n1-audio-sync-diff-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const output = join(root, 'output'), summary = join(root, 'summary')
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'pipe' })
  git('init', '-q')
  const metadata = 'src/data/audio-index.json'
  mkdirSync(join(root, 'src/data'), { recursive: true })
  mkdirSync(join(root, 'scripts'))
  copyFileSync(new URL('../scripts/verify-audio-changed-paths.ts', import.meta.url), join(root, 'scripts/verify-audio-changed-paths.ts'))
  writeFileSync(join(root, metadata), '{}\n')
  writeFileSync(join(root, 'other.txt'), 'original')
  git('add', '.')
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture')

  const gate = audioShell(audioStep('Check for audio metadata changes'))
  const runGate = () => {
    writeFileSync(output, '')
    const result = spawnSync('bash', ['-e', '-c', gate], {
      cwd: root, env: { ...process.env, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary },
    })
    return [result.status, readFileSync(output, 'utf8')]
  }
  assert.deepEqual(runGate(), [0, 'changed=false\n'])
  writeFileSync(join(root, metadata), '{"changed":true}\n')
  assert.deepEqual(runGate(), [0, 'changed=true\n'])
  writeFileSync(join(root, 'other.txt'), 'unexpected')
  assert.deepEqual(runGate(), [1, ''])

  const validation = audioStep('Validate audio snapshot, content and unit contracts')
  const commit = audioStep('Commit audio metadata with fast-forward protection')
  for (const step of [validation, commit]) assert.match(step, /if: steps\.metadata\.outputs\.changed == 'true'/)
  for (const command of ['npm run audio:validate -- --snapshot', 'npm test', 'npm run build:ci', 'git diff --check']) {
    assert.ok(validation.includes(command))
  }
  assert.ok(commit.includes('test "$(git rev-parse origin/main)" = "$base"'))
  assert.ok(commit.includes('git push origin HEAD:main'))
  assert.match(audioStep('Deploy changed audio metadata'), /if: steps\.commit\.outputs\.changed == 'true'/)
})

test('CI uses a pinned runner, early type checks, conditional tools and exact archive shards', () => {
  for (const source of [pages, workflow, sharedAudio]) assert.doesNotMatch(source, /runs-on: ubuntu-latest/)
  for (const source of [pages, workflow]) {
    assert.ok(source.indexOf('- name: Typecheck') < source.indexOf('- name: Unit tests'))
    assert.match(source, /run: npm run build:ci/)
  }
  const install = audioStep('Install audio inspection tools')
  assert.match(install, /if: steps\.plan\.outputs\.needed != '0'/)
  assert.match(install, /command -v ffmpeg/)
  assert.match(install, /command -v ffprobe/)
  assert.match(install, /timeout-minutes: 5/)
  assert.match(audioStep('Plan shared audio candidates'), /--plan-only/)
  assert.ok(sharedAudio.indexOf('- name: Plan shared audio candidates') < sharedAudio.indexOf('- name: Install audio inspection tools'))
  assert.ok(sharedAudio.indexOf('- name: Capture candidate audio tree') < sharedAudio.indexOf('- name: Typecheck'))
  assert.ok(sharedAudio.indexOf('- name: Typecheck') < sharedAudio.indexOf('- name: Validate audio snapshot, content and unit contracts'))
  assert.match(audioStep('Deploy changed audio metadata'), /validated_run_id=\$GITHUB_RUN_ID/)
})

test('an unchanged release is an opt-in verified equivalent, not a blind path-ignore or audio trigger', () => {
  assert.match(pages, /id: unchanged[\s\S]*?if: github\.event_name == 'push'/)
  assert.match(pages, /node scripts\/ci-unchanged-release\.mjs/)
  assert.match(pages, /if: needs\.build\.outputs\.unchanged_release != 'true'/)
  assert.match(pages, /Verify live target date and exact release assets/)
  assert.match(audioStep('Check publication trigger'), /Verify live target date and exact release assets/)
  assert.match(audioStep('Check publication trigger'), /skipped\)[\s\S]*?execute=false/)
  for (const name of ['Checkout current N1 main', 'Plan shared audio candidates', 'Verify and merge shared audio, record pending utterances']) {
    assert.match(audioStep(name), /if: steps\.publication\.outputs\.execute == 'true'/)
  }
})
