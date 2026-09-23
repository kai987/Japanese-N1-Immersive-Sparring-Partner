import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const policy = JSON.parse(readFileSync(new URL('../docs/automation/policy.json', import.meta.url), 'utf8'));
const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
export function dateInfo(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid targetDate');
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) throw new Error('invalid targetDate');
  return { date, day: 1 + Math.round((time - Date.parse(`${policy.planStart}T00:00:00Z`)) / 86400000),
    daysRemaining: Math.round((Date.parse(`${policy.planEnd}T00:00:00Z`) - time) / 86400000),
    inPlan: date >= policy.planStart && date <= policy.planEnd };
}
export const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
export function makeSourceRecord(targetDate, generatedAtJST, markdown) {
  const { day, inPlan } = dateInfo(targetDate);
  if (!inPlan) throw new Error('source date is outside the 99-day plan; do not invent Day 100');
  if (typeof generatedAtJST !== 'string' || !/\+09:00$/.test(generatedAtJST) || !Number.isFinite(Date.parse(generatedAtJST))) throw new Error('real generatedAtJST with +09:00 required');
  if (typeof markdown !== 'string' || !markdown.trim() || markdown.includes('\u0000')) throw new Error('complete UTF-8 source required');
  const heading = markdown.split('\n').find(line => /^#\s/.test(line)) || '';
  const headerDay = heading.match(/\bDay\s+(\d+)\b/i);
  const [year, month, date] = targetDate.split('-').map(Number);
  if (!headerDay || Number(headerDay[1]) !== day || !(heading.includes(targetDate) || heading.includes(`${year}年${month}月${date}日`))) throw new Error('source heading date/Day mismatch');
  if (!/(?:学习|學習|学習)/.test(markdown) || !/(?:错题|錯題)/.test(markdown)) throw new Error('source learning/review sections missing');
  return { schemaVersion: 1, targetDate, day, generatedAtJST, sha256: sha256(markdown), bytes: Buffer.byteLength(markdown, 'utf8'), markdown };
}
export function verifySourceRecord(record) {
  if (record?.schemaVersion !== 1) throw new Error('unsupported source record');
  const actual = makeSourceRecord(record.targetDate, record.generatedAtJST, record.markdown);
  if (record.day !== actual.day || record.bytes !== actual.bytes || record.sha256 !== actual.sha256) throw new Error('source record checksum/metadata mismatch');
  return actual;
}
export function writeSourceRecord(record, destination) {
  verifySourceRecord(record);
  if (existsSync(destination)) {
    const old = verifySourceRecord(JSON.parse(readFileSync(destination, 'utf8')));
    if (old.targetDate !== record.targetDate || old.sha256 !== record.sha256) throw new Error('different original already checkpointed; explicit correction required');
    return false;
  }
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  return true;
}
export function restoreSource(record, repositoryRoot) {
  verifySourceRecord(record);
  const target = resolve(repositoryRoot, policy.sourceDirectory, `${record.targetDate}.md`);
  if (existsSync(target)) {
    if (readFileSync(target, 'utf8') !== record.markdown) throw new Error('original differs; refusing to overwrite');
    return { changed: false, target };
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, record.markdown, { flag: 'wx' });
  if (sha256(readFileSync(target, 'utf8')) !== record.sha256) throw new Error('source read-back mismatch');
  return { changed: true, target };
}
export function validateRequest(request) {
  const info = dateInfo(request?.targetDate);
  if (!info.inPlan || request?.daily?.lesson?.date !== info.date || request.daily.lesson.day !== info.day) throw new Error('locked request date/Day mismatch');
  for (const field of ['sourceCommit', 'sourceBlobSha']) if (!SHA.test(request[field] || '')) throw new Error(`invalid ${field}`);
  if (!SHA256.test(request.snapshotSha256 || '')) throw new Error('invalid snapshotSha256');
  for (const field of ['issueNumber', 'totalDays']) if (!Number.isInteger(request[field]) || request[field] < 1) throw new Error(`invalid ${field}`);
  if (request.issueNumber > request.totalDays) throw new Error('issueNumber exceeds totalDays');
  return request;
}
// The event is a hint, never authority to substitute or regenerate a request.
export function selectRequest(request, eventName, event = {}) {
  if (!request) return { execute: false, reason: 'waiting_request' };
  const hints = eventName === 'repository_dispatch' ? (event.client_payload || {}) : (event.inputs || {});
  if (hints.source_commit && !SHA.test(hints.source_commit)) throw new Error('invalid dispatch source_commit');
  if (hints.target_date) dateInfo(hints.target_date);
  if ((hints.source_commit && hints.source_commit !== request.sourceCommit) || (hints.target_date && hints.target_date !== request.targetDate)) return { execute: false, reason: 'waiting_matching_request' };
  validateRequest(request);
  return { execute: true, reason: 'locked_request_ready' };
}
export function publishedRun(run, sourceCommit) {
  return Boolean(run && run.head_sha === sourceCommit && run.head_branch === 'main' &&
    run.repository?.full_name === policy.upstreamRepository && run.path === policy.upstreamWorkflow &&
    run.status === 'completed' && run.conclusion === 'success');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'stage' && args.length === 4) {
      const [date, timestamp, source, destination] = args;
      console.log(JSON.stringify({ changed: writeSourceRecord(makeSourceRecord(date, timestamp, readFileSync(source, 'utf8')), destination) }));
    } else if (command === 'restore' && args.length === 2) {
      console.log(JSON.stringify(restoreSource(JSON.parse(readFileSync(args[0], 'utf8')), args[1])));
    } else throw new Error('Usage: stage DATE TIMESTAMP SOURCE.md RECORD.json | restore RECORD.json REPOSITORY_ROOT');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
