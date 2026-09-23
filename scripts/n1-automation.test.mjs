import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { dateInfo, makeSourceRecord, verifySourceRecord, restoreSource, writeSourceRecord, validateRequest, selectRequest, publishedRun, policy } from './n1-automation.mjs';
const original = '# Day 25 / 99｜2026年9月23日（水）\n\n## 学习安排\n完整正文。\n## 今日の錯題3問\n题目，不提前给答案。\n';
const make = () => makeSourceRecord('2026-09-23', '2026-09-23T09:00:00+09:00', original);
const request = () => ({ targetDate: '2026-09-23', sourceCommit: 'a'.repeat(40), sourceBlobSha: 'b'.repeat(40), snapshotSha256: 'c'.repeat(64), issueNumber: 40, totalDays: 40, daily: {lesson: {date: '2026-09-23', day: 25}} });
test('plan has 99 days and no negative countdown in a new plan', () => {
  assert.equal(dateInfo('2026-08-30').day, 1);
  assert.deepEqual(dateInfo('2026-12-06'), {date:'2026-12-06', day:99, daysRemaining:0, inPlan:true});
  assert.equal(dateInfo('2026-12-07').inPlan, false);
  assert.throws(() => dateInfo('2026-02-30'));
  assert.throws(() => dateInfo('../../bad'));
});
test('original UTF-8 bytes and trailing newline are retained', () => {
  assert.equal(verifySourceRecord(make()).markdown, original);
  assert.equal(make().bytes, Buffer.byteLength(original));
});
test('checksum corruption and incorrect metadata fail closed', () => {
  assert.throws(() => verifySourceRecord({...make(), markdown: original+'改写'}));
  assert.throws(() => verifySourceRecord({...make(), day:24}));
  assert.throws(() => makeSourceRecord('2026-09-23', '2026-09-23T09:00:00', original));
});
test('wrong date, missing sections and Day mismatch are not a checkpoint', () => {
  assert.throws(() => makeSourceRecord('2026-09-24', '2026-09-24T09:00:00+09:00', original));
  assert.throws(() => makeSourceRecord('2026-09-23', '2026-09-23T09:00:00+09:00', original.split('## 今日')[0]));
});
test('source checkpoint and restoration are idempotent; different originals are protected', () => {
  const root = mkdtempSync(join(tmpdir(),'n1-source-'));
  try {
    const file=join(root,'record.json');
    assert.equal(writeSourceRecord(make(),file),true);
    assert.equal(writeSourceRecord(make(),file),false);
    assert.throws(() => writeSourceRecord(makeSourceRecord('2026-09-23','2026-09-23T09:00:00+09:00',original+'不同'),file));
    const saved=restoreSource(make(),root);
    assert.equal(saved.changed,true);
    assert.equal(readFileSync(saved.target,'utf8'),original);
    assert.equal(restoreSource(make(),root).changed,false);
    writeFileSync(saved.target,'another original');
    assert.throws(()=>restoreSource(make(),root));
  } finally {rmSync(root,{recursive:true,force:true});}
});
test('dispatch can resume a matching locked request', () => {
  assert.equal(selectRequest(request(),'workflow_dispatch',{inputs:{source_commit:'a'.repeat(40)}}).execute,true);
  assert.equal(selectRequest(request(),'repository_dispatch',{client_payload:{target_date:'2026-09-23'}}).execute,true);
});
test('a callback never remaps an old request to a new commit or day', () => {
  assert.equal(selectRequest(request(),'workflow_dispatch',{inputs:{source_commit:'d'.repeat(40)}}).execute,false);
  assert.equal(selectRequest(null,'workflow_dispatch').reason,'waiting_request');
  assert.throws(()=>selectRequest(request(),'workflow_dispatch',{inputs:{source_commit:'$(bad)'}}));
  assert.throws(()=>validateRequest({...request(),sourceBlobSha:'bad'}));
});
test('only the exact successful main Pages workflow authorizes upstream import', () => {
  const run={head_sha:'a'.repeat(40),head_branch:'main',path:policy.upstreamWorkflow,status:'completed',conclusion:'success',repository:{full_name:policy.upstreamRepository}};
  assert.equal(publishedRun(run,'a'.repeat(40)),true);
  for (const bad of [{head_branch:'draft/daily-2026-09-23'},{conclusion:'failure'},{path:'.github/workflows/audio.yml'},{repository:{full_name:'other/repo'}}]) assert.equal(publishedRun({...run,...bad},'a'.repeat(40)),false);
});
test('shared policy preserves flexible counts and daily-only N1 recovery', () => {
  assert.equal(policy.learning.grammarMinimum,5); assert.equal(policy.learning.grammarMaximum,8);
  assert.equal(policy.learning.allowDocumentedShortfall,true);
  assert.equal(policy.schedule.recoveryHourJST,12); assert.equal(policy.schedule.recoveryRunsPerDay,1);
});
