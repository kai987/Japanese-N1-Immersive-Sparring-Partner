import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { makeSourceRecord, policy } from './n1-automation.mjs';

const script = fileURLToPath(new URL('./promote-n1-sources.mjs', import.meta.url));
const date = '2026-09-23';
const sourcePath = `n1-source/${date}.md`;
const checkpoint = `runs/${date}/source.json`;
const original = '# Day 25｜2026年9月23日\n\n## 学习\n日本語の教材。\n## 错题\n原稿。\n';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'n1-source-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const remote = join(root, 'origin.git');
  const working = join(root, 'writer');
  const git = (...args) => execFileSync('git', args, { cwd: working, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
  const tip = branch => git('--git-dir', remote, 'rev-parse', branch);
  mkdirSync(working);
  git('init', '--bare', '--initial-branch=main', remote);
  git('init', '--initial-branch=main');
  git('config', 'user.name', 'N1 Test');
  git('config', 'user.email', 'test@example.invalid');
  git('remote', 'add', 'origin', remote);
  git('commit', '--allow-empty', '-m', 'initial main');
  git('push', 'origin', 'main');
  git('switch', '-c', policy.sourceProgressBranch);
  mkdirSync(join(working, 'runs', date), { recursive: true });
  const record = makeSourceRecord(date, `${date}T09:00:00+09:00`, original);
  writeFileSync(join(working, checkpoint), JSON.stringify(record));
  git('add', checkpoint);
  git('commit', '-m', 'checkpoint');
  git('push', 'origin', policy.sourceProgressBranch);
  git('switch', 'main');
  const run = (env = process.env) => spawnSync(process.execPath, [script], { cwd: working, encoding: 'utf8', env });
  return { git, run, root, remote, working, tip };
}

test('retains a remote checkpoint after a rejected push, then publishes exact bytes once', t => {
  const { git, run, remote, tip, working } = fixture(t);
  const checkpointCommit = tip(policy.sourceProgressBranch);
  const mainBefore = tip('main');
  const hook = join(remote, 'hooks', 'pre-receive');
  writeFileSync(hook, '#!/bin/sh\necho "test rejected write" >&2\nexit 1\n', { mode: 0o755 });
  const failed = run();
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /test rejected write/);
  assert.equal(tip('main'), mainBefore);
  assert.equal(tip(policy.sourceProgressBranch), checkpointCommit);

  rmSync(hook);
  writeFileSync(join(working, 'unrelated.txt'), 'staged user change');
  git('add', 'unrelated.txt');
  const published = run();
  assert.equal(published.status, 0, published.stderr);
  assert.deepEqual(JSON.parse(published.stdout).promoted, [date]);
  const mainAfter = tip('main');
  const saved = execFileSync('git', ['--git-dir', remote, 'show', `main:${sourcePath}`], { encoding: 'utf8' });
  assert.equal(saved, original);
  assert.equal(git('--git-dir', remote, 'diff', '--name-only', mainBefore, mainAfter), sourcePath);
  assert.equal(git('rev-parse', 'HEAD'), mainBefore);
  assert.equal(git('diff', '--cached', '--name-only'), 'unrelated.txt');
  const repeated = run();
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.deepEqual(JSON.parse(repeated.stdout).promoted, []);
  assert.equal(tip('main'), mainAfter);
  assert.equal(tip(policy.sourceProgressBranch), checkpointCommit);
});

test('retains both versions when main already has a different original', t => {
  const { git, run, working, tip } = fixture(t);
  mkdirSync(join(working, 'n1-source'));
  writeFileSync(join(working, sourcePath), original + 'A separately saved original\n');
  git('add', sourcePath);
  git('commit', '-m', 'existing original');
  git('push', 'origin', 'main');
  const before = tip('main');
  const checkpointBefore = tip(policy.sourceProgressBranch);
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /main already has a different original/);
  assert.equal(tip('main'), before);
  assert.equal(tip(policy.sourceProgressBranch), checkpointBefore);
});

test('re-reads both branches if the first push succeeded but its response was lost', t => {
  const { git, run, root, tip } = fixture(t);
  const mainBefore = tip('main');
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const marker = join(root, 'push-attempt');
  writeFileSync(join(root, 'git'), `#!/bin/sh
if [ "$1" = push ]; then
  if [ -e "$N1_TEST_MARKER" ]; then
    echo "test duplicate push" >&2
    exit 1
  fi
  touch "$N1_TEST_MARKER"
  "$N1_TEST_GIT" "$@" || exit $?
  echo "connection reset (test)" >&2
  exit 1
fi
exec "$N1_TEST_GIT" "$@"
`, { mode: 0o755 });
  const result = run({ ...process.env, PATH: `${root}:${process.env.PATH}`, N1_TEST_GIT: realGit, N1_TEST_MARKER: marker });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /connection reset .*re-reading both branches/);
  assert.equal(JSON.parse(result.stdout).mainCommit, tip('main'));
  assert.equal(git('rev-list', '--count', `${mainBefore}..origin/main`), '1');
});
