#!/usr/bin/env python3
"""Hold one OS process lock across exec into the N1 Node audio worker."""
from __future__ import annotations

import errno
import fcntl
import json
import os
from pathlib import Path
import sys


def main() -> int:
    if len(sys.argv) != 4:
        print('Usage: audio-worker-lock.py STATE_DIR NODE_PATH WORKER_PATH', file=sys.stderr)
        return 1

    descriptor = None
    try:
        root = Path(sys.argv[1]).expanduser().resolve()
        node = str(Path(sys.argv[2]).expanduser().resolve())
        worker = str(Path(sys.argv[3]).expanduser().resolve())
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        flags = os.O_RDWR | os.O_CREAT | getattr(os, 'O_NOFOLLOW', 0)
        descriptor = os.open(root / 'worker.process.lock', flags, 0o600)
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            if error.errno not in (errno.EACCES, errno.EAGAIN, errno.EWOULDBLOCK):
                raise
            print(json.dumps({'status': 'busy'}), flush=True)
            return 0

        # Python normally closes descriptors on exec. Preserve this one open
        # file description so flock remains held for Node's entire lifetime.
        os.set_inheritable(descriptor, True)
        environment = os.environ.copy()
        environment['N1_AUDIO_LOCK_FD'] = str(descriptor)
        environment['N1_AUDIO_LOCK_OWNER'] = str(os.getpid())
        os.execve(node, [node, worker, '--state-dir', str(root), '--lock-fd', str(descriptor)], environment)
        return 1  # execve returns only by raising an error.
    except OSError as error:
        # Never print command arguments, environment, or credential values.
        print(f'Audio worker process lock failed (errno {error.errno}).', file=sys.stderr)
        return 1
    finally:
        if descriptor is not None:
            os.close(descriptor)


if __name__ == '__main__':
    raise SystemExit(main())
