"""Candidate generation isolation and durable resume; no running TTS required."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import redirect_stdout
from copy import deepcopy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('n1_generate_audio', Path(__file__).resolve().parents[1] / 'scripts/generate-audio.py')
GENERATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GENERATOR)

VOICE = {'engine': 'AivisSpeech', 'name': 'morioki', 'style': 'ノーマル',
    'styleId': 497929760, 'speakerUuid': '396a746d-742f-4e43-b722-1182a7fab9af',
    'speed': 1, 'sampleRate': 24000, 'codec': 'mp3-64k'}
ENTRY = {'id': '0123456789abcdef', 'text': '録音を再開します。', 'label': '再開',
    'references': ['lesson/2026-10-19/example']}
PLAN = {'version': 1, 'voice': VOICE, 'lessonDates': ['2026-10-19'], 'entries': [ENTRY]}


class GenerationResumeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.work = self.root / 'private-candidates'
        self.audio = self.work / 'morioki-normal'
        self.audio.mkdir(parents=True)
        self.clip = {**ENTRY, 'bytes': 1024, 'duration': 1.5, 'rms': .1,
            'sha256': hashlib.sha256(b'x' * 1024).hexdigest()}
        self.manifest = {'version': 1, 'voice': VOICE, 'modelVersion': '1.0.0',
            'engineVersion': 'old-engine', 'generatedAt': '2026-10-18T00:00:00Z',
            'lessonDates': ['2026-10-19'], 'expectedClips': 1, 'complete': True,
            'clips': {ENTRY['id']: self.clip}}
        self.index = {'version': 1, 'voice': VOICE, 'clips': {ENTRY['id']: 1.5}}
        self.sources = {'complete': True, 'verifiedAt': '2026-10-18T00:00:00Z',
            'voice': VOICE, 'modelVersion': '1.0.0', 'clips': {
                ENTRY['id']: {'provider': 'supabase', 'sha256': self.clip['sha256'], 'bytes': 1024}}}
        self.plan_path = self.root / 'frozen-plan.json'
        self.plan_path.write_text(json.dumps(PLAN), encoding='utf-8')
        self.published = {
            'public/audio/manifest.json': self.manifest,
            'src/data/audio-index.json': self.index,
            'src/data/audio-sources.json': self.sources,
        }
        for relative, value in self.published.items():
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(value), encoding='utf-8')
        (self.root / 'public/audio/morioki-license.txt').write_text('published license', encoding='utf-8')

    def request(self, base, endpoint, *args, **kwargs):
        if endpoint == '/speakers':
            return [{'speaker_uuid': VOICE['speakerUuid'], 'name': VOICE['name'],
                'version': '1.0.0', 'styles': [{'id': VOICE['styleId'], 'name': VOICE['style']}]}]
        if endpoint == '/version':
            return 'updated-engine'
        if endpoint == '/speaker_info':
            return {'policy': 'candidate license'}
        self.fail(f'Previously published audio must not be synthesized: {endpoint}')

    def run_main(self, *arguments, request=None):
        with patch.object(GENERATOR, 'ROOT', self.root), \
            patch.object(GENERATOR, 'request', side_effect=request or self.request), \
            patch.object(GENERATOR.subprocess, 'run') as collector, \
            patch('sys.argv', ['generate-audio.py', '--plan', str(self.plan_path), '--work-dir', str(self.work), *arguments]), \
            redirect_stdout(io.StringIO()):
            result = GENERATOR.main()
            collector.assert_not_called()
            return result

    def test_work_mode_seeds_hosted_history_without_changing_published_metadata(self):
        before = {path: (self.root / path).read_bytes() for path in [*self.published, 'public/audio/morioki-license.txt']}
        self.assertEqual(self.run_main(), 0)
        candidate = json.loads((self.work / 'manifest.json').read_text())
        self.assertEqual(candidate['clips'], self.manifest['clips'])
        self.assertTrue(candidate['complete'])
        self.assertEqual(json.loads((self.work / 'audio-index.json').read_text()), self.index)
        self.assertEqual((self.work / 'morioki-license.txt').read_text(), 'candidate license')
        self.assertFalse((self.root / 'public/audio/morioki-normal').exists())
        self.assertEqual(before, {path: (self.root / path).read_bytes() for path in before})
        # A repeated invocation is idempotent despite an engine patch version.
        candidate_bytes = (self.work / 'manifest.json').read_bytes()
        self.assertEqual(self.run_main(), 0)
        self.assertEqual((self.work / 'manifest.json').read_bytes(), candidate_bytes)

    def test_work_directory_cannot_alias_published_metadata(self):
        with patch.object(GENERATOR, 'ROOT', self.root):
            for directory in [self.root / 'public/audio', self.root / 'src/data']:
                with self.assertRaisesRegex(ValueError, 'must not replace published'):
                    GENERATOR.output_paths(directory)

    def test_current_published_shared_clips_win_over_a_stale_candidate_manifest(self):
        self.assertEqual(self.run_main(), 0)
        cached = json.loads((self.work / 'manifest.json').read_text())
        cached['clips'][ENTRY['id']]['sha256'] = 'd' * 64
        (self.work / 'manifest.json').write_text(json.dumps(cached))
        shared_entry = {**ENTRY, 'id': 'fedcba9876543210', 'text': '共有音声が追加されました。'}
        self.manifest['clips'][shared_entry['id']] = {**self.clip, **shared_entry}
        self.manifest['expectedClips'] = 2
        (self.root / 'public/audio/manifest.json').write_text(json.dumps(self.manifest))
        self.sources['clips'][shared_entry['id']] = {'provider': 'daily'}
        (self.root / 'src/data/audio-sources.json').write_text(json.dumps(self.sources))
        self.plan_path.write_text(json.dumps({**PLAN, 'entries': [ENTRY, shared_entry]}))
        self.assertEqual(self.run_main(), 0)
        candidate = json.loads((self.work / 'manifest.json').read_text())
        self.assertEqual(candidate['clips'], self.manifest['clips'])
        self.assertTrue(candidate['complete'])

    def test_sidecar_recovers_completed_bytes_before_manifest_checkpoint(self):
        temporary = self.audio / f"{ENTRY['id']}.partial.mp3"
        target = self.audio / f"{ENTRY['id']}.mp3"
        temporary.write_bytes(b'x' * 1024)
        completed = GENERATOR.persist_clip(ENTRY, temporary, target, VOICE, '1.0.0', 'old-engine', 1.5, .1)
        self.assertFalse(temporary.exists())
        self.assertFalse((self.work / 'manifest.json').exists(), 'simulate a crash before the batch checkpoint')
        new_entry = {**ENTRY, 'label': '更新した表示', 'references': ['lesson/2026-10-20/example']}
        recovered = GENERATOR.recover_clip(new_entry, self.audio, VOICE, '1.0.0')
        self.assertEqual(recovered, {**completed, 'label': new_entry['label'], 'references': new_entry['references']})
        self.assertIsNone(GENERATOR.recover_clip({**ENTRY, 'text': '別の文です。'}, self.audio, VOICE, '1.0.0'))
        self.assertIsNone(GENERATOR.recover_clip(ENTRY, self.audio, VOICE, '2.0.0'))
        self.assertIsNone(GENERATOR.recover_clip(ENTRY, self.audio, {**VOICE, 'speed': .9}, '1.0.0'))
        target.write_bytes(b'y' * 1024)
        self.assertIsNone(GENERATOR.recover_clip(ENTRY, self.audio, VOICE, '1.0.0'))

    def test_journaled_unpublished_clip_is_reused_after_partial_run(self):
        self.sources['clips'] = {}
        (self.root / 'src/data/audio-sources.json').write_text(json.dumps(self.sources))
        # No successful prior batch metadata exists for this clip.
        self.manifest['clips'] = {}
        self.manifest['complete'] = False
        (self.root / 'public/audio/manifest.json').write_text(json.dumps(self.manifest))
        temporary = self.audio / f"{ENTRY['id']}.partial.mp3"
        temporary.write_bytes(b'x' * 1024)
        GENERATOR.persist_clip(ENTRY, temporary, self.audio / f"{ENTRY['id']}.mp3", VOICE, '1.0.0', 'old-engine', 1.5, .1)
        self.assertEqual(self.run_main(), 0)
        candidate = json.loads((self.work / 'manifest.json').read_text())
        self.assertEqual(candidate['clips'][ENTRY['id']]['sha256'], self.clip['sha256'])
        self.assertTrue(candidate['complete'])

    def test_corrupt_candidate_manifest_is_preserved_and_sidecars_recover(self):
        published_bytes = (self.root / 'public/audio/manifest.json').read_bytes()
        corrupted = b'{"clips": {"interrupted": '
        (self.work / 'manifest.json').write_bytes(corrupted)
        temporary = self.audio / f"{ENTRY['id']}.partial.mp3"
        temporary.write_bytes(b'x' * 1024)
        GENERATOR.persist_clip(ENTRY, temporary, self.audio / f"{ENTRY['id']}.mp3", VOICE, '1.0.0', 'old-engine', 1.5, .1)
        # Disable hosted reuse to prove the orphaned clip journal is recovered.
        self.sources['clips'] = {}
        (self.root / 'src/data/audio-sources.json').write_text(json.dumps(self.sources))
        self.assertEqual(self.run_main(), 0)
        preserved = list(self.work.glob('manifest.json.invalid-*'))
        self.assertEqual(len(preserved), 1)
        self.assertEqual(preserved[0].read_bytes(), corrupted)
        candidate = json.loads((self.work / 'manifest.json').read_text())
        self.assertTrue(candidate['complete'])
        self.assertEqual(candidate['clips'][ENTRY['id']]['sha256'], self.clip['sha256'])
        self.assertEqual((self.root / 'public/audio/manifest.json').read_bytes(), published_bytes)

    def test_corrupt_published_manifest_fails_closed_without_renaming(self):
        corrupted = b'{"clips": '
        path = self.root / 'public/audio/manifest.json'
        path.write_bytes(corrupted)
        with self.assertRaises(json.JSONDecodeError):
            self.run_main()
        self.assertEqual(path.read_bytes(), corrupted)
        self.assertEqual(list(path.parent.glob('manifest.json.invalid-*')), [])
        self.assertFalse((self.work / 'manifest.json').exists())

    def test_model_change_fails_instead_of_resynthesizing_history(self):
        def changed_model(base, endpoint, *args, **kwargs):
            response = self.request(base, endpoint, *args, **kwargs)
            if endpoint == '/speakers':
                response[0]['version'] = '2.0.0'
            return response
        with self.assertRaisesRegex(RuntimeError, 'restore the pinned model'):
            self.run_main(request=changed_model)
        self.assertFalse((self.work / 'manifest.json').exists())

    def test_stop_drains_in_flight_successes(self):
        interrupted = threading.Event()
        started = threading.Barrier(2)
        def first():
            started.wait(timeout=2)
            interrupted.set()
            return {'id': 'first'}
        def second():
            started.wait(timeout=2)
            time.sleep(.03)
            return {'id': 'second'}
        successes, failures = [], []
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = {pool.submit(first): {'id': 'first'}, pool.submit(second): {'id': 'second'}}
            GENERATOR.consume_generation(futures, interrupted, successes.append,
                lambda entry, error: failures.append((entry, error)), lambda number: None)
        self.assertEqual({clip['id'] for clip in successes}, {'first', 'second'})
        self.assertEqual(failures, [])

    def test_frozen_plan_rejects_other_voices_and_unsafe_ids(self):
        changed = deepcopy(PLAN)
        changed['voice']['styleId'] = 1
        with self.assertRaises(ValueError):
            GENERATOR.validate_plan(changed)
        changed = deepcopy(PLAN)
        changed['entries'][0]['id'] = '../escape'
        with self.assertRaises(ValueError):
            GENERATOR.validate_plan(changed)


if __name__ == '__main__':
    unittest.main()
