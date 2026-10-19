"""Exercise the inherited OS lock with scratch Node workers only."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import unittest

HELPER = Path(__file__).resolve().parents[1] / 'scripts/audio-worker-lock.py'
NODE = shutil.which('node')


@unittest.skipUnless(NODE, 'Node is needed to verify lock inheritance across exec')
class WorkerProcessLockTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='n1 worker lock ')
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.state = self.directory / 'state'
        self.worker = self.directory / 'scratch-worker.mjs'
        self.worker.write_text('''
import { fstatSync, statSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const descriptor = Number(process.env.N1_AUDIO_LOCK_FD);
const root = args[args.indexOf('--state-dir') + 1];
const lock = fstatSync(descriptor);
const expected = statSync(root + '/worker.process.lock');
writeFileSync(process.env.N1_TEST_LOCK_READY, JSON.stringify({
  pid: process.pid, owner: Number(process.env.N1_AUDIO_LOCK_OWNER), descriptor,
  argument: Number(args[args.indexOf('--lock-fd') + 1]),
  device: lock.dev, inode: lock.ino,
  matching: lock.dev === expected.dev && lock.ino === expected.ino,
}));
setInterval(() => {}, 1000);
''', encoding='utf-8')

    def arguments(self):
        return [sys.executable, str(HELPER), str(self.state), NODE, str(self.worker)]

    def start(self, name):
        ready = self.directory / f'{name}.json'
        environment = os.environ.copy()
        environment['N1_TEST_LOCK_READY'] = str(ready)
        process = subprocess.Popen(self.arguments(), env=environment,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.addCleanup(self.stop, process)
        deadline = time.monotonic() + 5
        while not ready.exists():
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                self.fail(f'Scratch worker ended before acquiring lock: {process.returncode}, {stdout}, {stderr}')
            if time.monotonic() >= deadline:
                self.fail('Scratch worker did not acquire its inherited lock')
            time.sleep(.01)
        return process, json.loads(ready.read_text(encoding='utf-8'))

    @staticmethod
    def stop(process):
        if process.poll() is None:
            process.kill()
        process.communicate(timeout=5)

    def test_lock_survives_exec_rejects_concurrency_and_recovers_after_kill(self):
        first, ownership = self.start('first')
        self.assertEqual(first.pid, ownership['pid'], 'exec retains the lock holder PID')
        self.assertEqual(ownership['pid'], ownership['owner'])
        self.assertEqual(ownership['descriptor'], ownership['argument'])
        self.assertTrue(ownership['matching'])
        lock_path = self.state / 'worker.process.lock'
        inode = lock_path.stat().st_ino

        second = subprocess.run(self.arguments(), capture_output=True, text=True, timeout=5)
        self.assertEqual(second.returncode, 0)
        self.assertEqual(json.loads(second.stdout), {'status': 'busy'})
        self.assertEqual(second.stderr, '')
        self.assertIsNone(first.poll())
        self.assertEqual(lock_path.stat().st_ino, inode)

        # SIGKILL cannot run cleanup handlers; the OS must release the lock.
        self.stop(first)
        third, next_ownership = self.start('after-kill')
        self.assertNotEqual(third.pid, first.pid)
        self.assertEqual(next_ownership['pid'], next_ownership['owner'])
        self.assertTrue(next_ownership['matching'])
        self.assertEqual(lock_path.stat().st_ino, inode, 'the persistent lock file is never deleted')
        self.assertEqual(lock_path.read_bytes(), b'', 'no PID or credential data is written into the lock')

    def test_failed_exec_releases_lock_and_does_not_print_arguments(self):
        sensitive_argument = self.directory / 'do-not-print-this-missing-node'
        result = subprocess.run([sys.executable, str(HELPER), str(self.state), str(sensitive_argument), str(self.worker)],
            capture_output=True, text=True, timeout=5)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, '')
        self.assertIn('errno', result.stderr)
        self.assertNotIn('do-not-print-this-missing-node', result.stderr)
        process, ownership = self.start('after-exec-failure')
        self.assertEqual(process.pid, ownership['owner'])
        self.assertTrue(ownership['matching'])


if __name__ == '__main__':
    unittest.main()
