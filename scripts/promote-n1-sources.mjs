import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { policy, verifySourceRecord } from './n1-automation.mjs';

const progressBranch = policy.sourceProgressBranch;
const checkpointPath = /^runs\/(\d{4}-\d{2}-\d{2})\/source\.json$/;
const retryableGitError = /non-fast-forward|fetch first|cannot lock ref|connection (?:reset|timed out)|could not resolve host|remote end hung up|unexpected disconnect|requested URL returned error: (?:429|500|502|503|504)/i;

function git(args, { input, index } = {}) {
  const result = spawnSync('git', args, {
    input, maxBuffer: 8 * 1024 * 1024, timeout: 60_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...(index && { GIT_INDEX_FILE: index }) },
  });
  if (result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.toString('utf8').trim();
    const error = new Error(`git ${args[0]}: ${detail}`);
    error.retryable = result.error?.code === 'ETIMEDOUT' || retryableGitError.test(detail);
    throw error;
  }
  return result.stdout;
}

function snapshot() {
  const branches = ['main', progressBranch];
  git(['fetch', '--no-tags', 'origin',
    ...branches.map(branch => `+refs/heads/${branch}:refs/remotes/origin/${branch}`)]);
  return Object.fromEntries(branches.map(branch =>
    [branch, git(['rev-parse', `refs/remotes/origin/${branch}`]).toString().trim()]));
}

function filesAt(commit, directory) {
  return new Set(git(['ls-tree', '-r', '--name-only', commit, '--', directory]).toString().trim().split('\n'));
}

function blobAt(commit, path) {
  return git(['cat-file', 'blob', `${commit}:${path}`]);
}

function readCheckpoints(refs) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: policy.timeZone }).format();
  const existing = filesAt(refs.main, policy.sourceDirectory);
  const records = [];
  for (const path of [...filesAt(refs[progressBranch], 'runs')].sort()) {
    const match = checkpointPath.exec(path);
    if (!match) continue;
    const date = match[1];
    try {
      const checkpoint = blobAt(refs[progressBranch], path);
      const record = verifySourceRecord(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(checkpoint)));
      if (record.targetDate !== date || date > today) throw new Error('checkpoint path/date mismatch or date not yet due');
      const sourcePath = `${policy.sourceDirectory}/${date}.md`;
      const source = Buffer.from(record.markdown, 'utf8');
      const missing = !existing.has(sourcePath);
      if (!missing && !blobAt(refs.main, sourcePath).equals(source)) {
        throw new Error('main already has a different original; explicit correction required');
      }
      records.push({ date, path, checkpoint, sourcePath, source, missing });
    } catch (error) {
      throw new Error(`${path}: ${error.message}`, { cause: error });
    }
  }
  return records;
}

function createCommit(parent, pending) {
  const temp = mkdtempSync(join(tmpdir(), 'n1-source-index-'));
  const index = join(temp, 'index');
  try {
    // Use a private index so the caller's checkout and staging area stay untouched.
    git(['read-tree', parent], { index });
    for (const { source, sourcePath } of pending) {
      const blob = git(['hash-object', '-w', '--stdin'], { input: source }).toString().trim();
      git(['update-index', '--add', '--cacheinfo', `100644,${blob},${sourcePath}`], { index });
    }
    const tree = git(['write-tree'], { index }).toString().trim();
    return git(['commit-tree', tree, '-p', parent, '-m',
      `content: promote verified N1 source (${pending.map(record => record.date).join(', ')})`]).toString().trim();
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

async function promote() {
  for (let attempt = 1; ; attempt++) {
    try {
      const refs = snapshot();
      const records = readCheckpoints(refs);
      const pending = records.filter(record => record.missing);
      if (pending.length === 0) return { mainCommit: refs.main, verified: records.length, promoted: [] };

      const commit = createCommit(refs.main, pending);
      const current = snapshot();
      if (current.main !== refs.main || current[progressBranch] !== refs[progressBranch]) {
        throw Object.assign(new Error('main or checkpoint branch advanced before push'), { retryable: true });
      }
      git(['push', 'origin', `${commit}:refs/heads/main`]);

      const remote = snapshot();
      for (const { path, checkpoint, sourcePath, source } of records) {
        if (!blobAt(remote[progressBranch], path).equals(checkpoint) || !blobAt(remote.main, sourcePath).equals(source)) {
          throw new Error(`${path}: remote checkpoint or source changed during promotion`);
        }
      }
      return { mainCommit: remote.main, verified: records.length, promoted: pending.map(record => record.date) };
    } catch (error) {
      if (!error.retryable || attempt >= policy.maximumTransientAttempts) throw error;
      console.error(`Attempt ${attempt}: ${error.message}; re-reading both branches before retry`);
      await delay(1000 * attempt);
    }
  }
}

try {
  console.log(JSON.stringify(await promote()));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
