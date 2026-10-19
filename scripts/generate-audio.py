#!/usr/bin/env python3
"""Generate resumable, content-addressed morioki recordings using local AivisSpeech."""
from __future__ import annotations
import argparse
import array
from concurrent.futures import CancelledError, ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import io
import json
import math
import os
import re
import signal
import threading
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import wave

ROOT = Path(__file__).resolve().parent.parent

def request(base, path, params=None, body=None, post=False, timeout=180):
    url = base.rstrip('/') + path
    if params:
        url += '?' + urllib.parse.urlencode(params)
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else b'' if post else None
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'} if body is not None else {})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        raw = response.read()
        return json.loads(raw) if 'json' in response.headers.get('Content-Type', '') else raw

def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.partial.json')
    with temporary.open('w', encoding='utf-8') as handle:
        handle.write(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
        handle.flush()
        os.fsync(handle.fileno())
    temporary.replace(path)

def output_paths(work_directory=None):
    """Keep unpublished candidates away from the published metadata snapshot."""
    base = Path(work_directory).resolve() if work_directory else ROOT / 'public/audio'
    paths = {
        'directory': base,
        'audio': base / 'morioki-normal',
        'manifest': base / 'manifest.json',
        'index': base / 'audio-index.json' if work_directory else ROOT / 'src/data/audio-index.json',
        'license': base / 'morioki-license.txt',
    }
    if work_directory:
        published = {ROOT / 'public/audio/manifest.json', ROOT / 'src/data/audio-index.json', ROOT / 'public/audio/morioki-license.txt'}
        if any(path.resolve() in {item.resolve() for item in published} for path in paths.values()):
            raise ValueError('The work directory must not replace published audio metadata.')
    return paths

def validate_plan(plan):
    expected_voice = {'engine': 'AivisSpeech', 'name': 'morioki', 'style': 'ノーマル',
        'styleId': 497929760, 'speakerUuid': '396a746d-742f-4e43-b722-1182a7fab9af',
        'speed': 1, 'sampleRate': 24000, 'codec': 'mp3-64k'}
    if plan.get('voice') != expected_voice or not isinstance(plan.get('entries'), list):
        raise ValueError('The audio plan must use the configured morioki / ノーマル (497929760) voice.')
    seen = set()
    for entry in plan['entries']:
        if (not isinstance(entry, dict) or not re.fullmatch('[a-f0-9]{16}', entry.get('id', ''))
            or not isinstance(entry.get('text'), str) or not entry['text'].strip()
            or not isinstance(entry.get('label'), str) or not entry['label']
            or not isinstance(entry.get('references'), list) or not entry['references']
            or any(not isinstance(reference, str) or not reference for reference in entry['references'])
            or entry['id'] in seen):
            raise ValueError('The frozen audio plan contains an invalid or duplicate recording.')
        seen.add(entry['id'])
    if not isinstance(plan.get('lessonDates'), list) or any(not isinstance(date, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date) for date in plan['lessonDates']):
        raise ValueError('The frozen audio plan must declare its lesson dates.')

def sidecar_path(output, clip_id):
    return output / f'{clip_id}.clip.json'

def load_candidate_manifest(path):
    """Preserve an interrupted candidate checkpoint and recover from journals.

    Only unpublished work metadata uses this fallback. Published manifests are
    always loaded strictly, so invalid production metadata cannot be hidden.
    """
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        preserved = path.with_name(f'{path.name}.invalid-{time.time_ns()}')
        while preserved.exists():
            preserved = path.with_name(f'{path.name}.invalid-{time.time_ns()}')
        path.rename(preserved)
        print('Preserved an invalid candidate manifest; recovering published recordings and verified clip journals.', flush=True)
        return {}

def persist_clip(entry, temporary, target, voice, model_version, engine_version, duration, rms):
    """Journal a finished clip before exposing its final filename.

    A crash after the MP3 rename but before the batch manifest checkpoint can
    therefore recover the exact validated bytes without synthesizing again.
    """
    encoded = temporary.read_bytes()
    with temporary.open('rb') as handle:
        os.fsync(handle.fileno())
    clip = {**entry, 'duration': round(duration, 3), 'bytes': len(encoded),
        'sha256': hashlib.sha256(encoded).hexdigest(), 'rms': round(rms, 6)}
    atomic_json(sidecar_path(target.parent, entry['id']), {'version': 1, 'voice': voice,
        'modelVersion': model_version, 'engineVersion': engine_version, 'clip': clip})
    temporary.replace(target)
    return clip

def recover_clip(entry, output, voice, model_version):
    """Recover only a complete, identity-matching and hash-verified sidecar."""
    path = output / f"{entry['id']}.mp3"
    try:
        sidecar = json.loads(sidecar_path(output, entry['id']).read_text(encoding='utf-8'))
        clip = sidecar['clip']
        if (sidecar.get('version') != 1 or sidecar.get('voice') != voice
            or sidecar.get('modelVersion') != model_version
            or clip.get('id') != entry['id'] or clip.get('text') != entry['text']
            or not isinstance(clip.get('bytes'), int) or clip['bytes'] < 512
            or not isinstance(clip.get('duration'), (int, float)) or not math.isfinite(clip['duration']) or clip['duration'] < .12
            or not isinstance(clip.get('rms'), (int, float)) or not math.isfinite(clip['rms']) or clip['rms'] < .0005
            or not re.fullmatch('[a-f0-9]{64}', clip.get('sha256', ''))):
            return None
        encoded = path.read_bytes()
        if len(encoded) != clip['bytes'] or hashlib.sha256(encoded).hexdigest() != clip['sha256']:
            return None
        return {**clip, 'label': entry['label'], 'references': entry['references']}
    except (OSError, ValueError, KeyError, TypeError):
        return None

def consume_generation(futures, interrupted, on_success, on_failure, on_progress):
    """Cancel queued work on stop, but drain every already running result."""
    stopping = False
    for number, future in enumerate(as_completed(futures), 1):
        try:
            clip = future.result()
            if clip is not None:
                on_success(clip)
        except CancelledError:
            pass
        except Exception as error:
            on_failure(futures[future], error)
        if interrupted.is_set() and not stopping:
            stopping = True
            for pending in futures:
                pending.cancel()
        on_progress(number)

def hosted_cache_matches(previous, sources):
    """A verified hosted snapshot remains usable after deleting local MP3s."""
    return (sources.get('complete') is True and bool(sources.get('verifiedAt'))
        and sources.get('voice') == previous.get('voice')
        and sources.get('modelVersion') == previous.get('modelVersion'))

def reusable_clip(entry, old, path, same_model, hosted_clips):
    if not same_model or not old or old['text'] != entry['text']:
        return False
    hosted = hosted_clips.get(entry['id'])
    if hosted and (hosted['provider'] == 'daily' or (hosted['sha256'] == old['sha256'] and hosted['bytes'] == old['bytes'])):
        return True
    return (path.exists() and path.stat().st_size == old['bytes']
        and hashlib.sha256(path.read_bytes()).hexdigest() == old['sha256'])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', action='append', help='Local engine URL; repeat to spread work across local engines')
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--plan', type=Path, help='Frozen collect-audio JSON; do not recollect a changing checkout')
    parser.add_argument('--work-dir', type=Path, help='Keep candidate audio and metadata in this isolated directory')
    args = parser.parse_args()
    if args.workers < 1 or (args.limit is not None and args.limit < 0):
        parser.error('Workers must be positive and limit must not be negative.')
    engines = args.engine or ['http://127.0.0.1:10101']
    for engine in engines:
        parsed = urllib.parse.urlparse(engine)
        if parsed.scheme not in ('http', 'https') or parsed.hostname not in ('127.0.0.1', 'localhost', '::1'):
            parser.error('Use a local AivisSpeech engine; remote synthesis is not supported.')
    if args.plan:
        plan = json.loads(args.plan.read_text(encoding='utf-8'))
    else:
        with tempfile.TemporaryDirectory(prefix='n1-audio-') as work:
            plan_path = Path(work) / 'plan.json'
            subprocess.run(['node', 'scripts/collect-audio.ts', str(plan_path)], cwd=ROOT, check=True)
            plan = json.loads(plan_path.read_text(encoding='utf-8'))
    validate_plan(plan)
    voice = plan['voice']
    actual = None
    for engine in engines:
        speakers = request(engine, '/speakers', timeout=15)
        speaker = next((speaker for speaker in speakers if speaker['speaker_uuid'] == voice['speakerUuid'] and speaker['name'] == voice['name'] and any(style['id'] == voice['styleId'] and style['name'] == voice['style'] for style in speaker['styles'])), None)
        if not speaker:
            raise RuntimeError(f'The requested morioki / ノーマル (497929760) voice is not installed on {engine}.')
        if actual and actual['version'] != speaker['version']:
            raise RuntimeError('All local engines must use the same morioki model version.')
        actual = speaker
    engine_version = request(engines[0], '/version', timeout=15)
    paths = output_paths(args.work_dir)
    output = paths['audio']
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = paths['manifest']
    published_path = ROOT / 'public/audio/manifest.json'
    published = json.loads(published_path.read_text(encoding='utf-8')) if published_path.exists() else {}
    cached = load_candidate_manifest(manifest_path) if args.work_dir else published
    for snapshot in (published, cached):
        if snapshot and snapshot.get('voice') != voice:
            raise RuntimeError('Existing audio uses a different voice configuration; preserve it and choose a new output directory.')
        if snapshot and snapshot.get('modelVersion') != actual['version']:
            raise RuntimeError(f"The installed morioki model ({actual['version']}) differs from the published/candidate model ({snapshot.get('modelVersion')}); preserve existing recordings and restore the pinned model before generating new clips.")
    # The persistent candidate cache can lag the current checkout. Newly merged
    # shared recordings and already published identities always win over cache.
    previous = {**published, **cached, 'clips': {**cached.get('clips', {}), **published.get('clips', {})}} if (published or cached) else {}
    previous_clips = previous.get('clips', {})
    sources_path = ROOT / 'src/data/audio-sources.json'
    sources = json.loads(sources_path.read_text()) if sources_path.exists() else {}
    hosted_clips = sources.get('clips', {}) if hosted_cache_matches(previous, sources) else {}
    # An engine patch must not invalidate already verified speech made with the
    # same voice/model. A model change requires an explicit migration instead.
    same_model = previous.get('modelVersion') == actual['version']
    current = {}
    missing = []
    for entry in plan['entries']:
        path = output / f"{entry['id']}.mp3"
        old = previous_clips.get(entry['id'])
        if reusable_clip(entry, old, path, same_model, hosted_clips):
            current[entry['id']] = {**old, 'label': entry['label'], 'references': entry['references']}
        else:
            recovered = recover_clip(entry, output, voice, actual['version'])
            if recovered is not None:
                current[entry['id']] = recovered
            else:
                missing.append(entry)
    policy = request(engines[0], '/speaker_info', {'speaker_uuid': voice['speakerUuid']}, timeout=15)['policy']
    paths['license'].write_text(policy, encoding='utf-8')
    if (not missing and current == previous_clips and manifest_path.exists() and paths['index'].exists()
        and previous.get('lessonDates') == plan['lessonDates']
        and previous.get('expectedClips') == len(plan['entries']) and previous.get('complete') is True):
        print(f"Complete: {len(current)} verified hosted/local recordings reused; nothing to generate.", flush=True)
        return 0
    interrupted = threading.Event()
    def handle_stop(signum, frame): interrupted.set()
    failures = []
    started = time.monotonic()
    def checkpoint():
        metadata = {'version': 1, 'voice': voice, 'engineVersion': engine_version, 'modelVersion': actual['version'],
            'generatedAt': datetime.now(timezone.utc).isoformat(), 'lessonDates': plan['lessonDates'],
            'expectedClips': len(plan['entries']), 'complete': len(current) == len(plan['entries']),
            'clips': {key: current[key] for key in sorted(current)}}
        atomic_json(manifest_path, metadata)
        atomic_json(paths['index'], {'version': 1, 'voice': voice, 'clips': {key: current[key]['duration'] for key in sorted(current)}})
    checkpoint()
    def synthesize(entry, engine):
        for attempt in range(3):
            if interrupted.is_set(): return None
            try:
                query = request(engine, '/audio_query', {'text': entry['text'], 'speaker': voice['styleId']}, post=True)
                query.update(speedScale=voice['speed'], outputSamplingRate=voice['sampleRate'], outputStereo=False)
                data = request(engine, '/synthesis', {'speaker': voice['styleId']}, body=query)
                with wave.open(io.BytesIO(data), 'rb') as wav:
                    if wav.getsampwidth() != 2 or wav.getnchannels() != 1:
                        raise ValueError('Expected mono 16-bit PCM from AivisSpeech')
                    samples = array.array('h', wav.readframes(wav.getnframes()))
                    if sys.byteorder == 'big': samples.byteswap()
                    duration = len(samples) / wav.getframerate()
                    rms = math.sqrt(sum(value * value for value in samples) / max(len(samples), 1)) / 32768
                    if duration < 0.12 or rms < 0.0005:
                        raise ValueError(f'Silent or empty recording: duration={duration}, RMS={rms}')
                target = output / f"{entry['id']}.mp3"
                temporary = target.with_suffix('.partial.mp3')
                subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', 'pipe:0', '-map_metadata', '-1', '-ac', '1', '-ar', str(voice['sampleRate']), '-c:a', 'libmp3lame', '-b:a', '64k', str(temporary)], input=data, check=True, capture_output=True)
                measured = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(temporary)]))
                if abs(measured - duration) > 0.25:
                    raise ValueError(f'Encoded duration mismatch: {measured} vs {duration}')
                return persist_clip(entry, temporary, target, voice, actual['version'], engine_version, measured, rms)
            except Exception:
                if attempt == 2: raise
                interrupted.wait(1 + attempt)
        raise AssertionError('unreachable')
    missing.sort(key=lambda entry: 0 if any(ref.startswith(('compound/', 'live/')) for ref in entry['references']) else 1)
    work = missing[:args.limit] if args.limit is not None else missing
    print(f"Voice verified: {actual['name']} / {voice['style']} ({voice['styleId']}); {len(current)} cached, {len(missing)} missing, {len(work)} queued", flush=True)
    def on_success(clip):
        current[clip['id']] = clip
    def on_failure(entry, error):
        failures.append({'id': entry['id'], 'text': entry['text'], 'error': str(error)})
        print(f"FAILED {entry['id']}: {error}", flush=True)
    def on_progress(number):
        if number % 20 == 0 or number == len(work):
            checkpoint()
            elapsed = time.monotonic() - started
            print(f"{len(current)}/{len(plan['entries'])} complete; {number}/{len(work)} this run; {elapsed:.1f}s; {len(failures)} failed", flush=True)
    old_handlers = {signum: signal.signal(signum, handle_stop) for signum in (signal.SIGINT, signal.SIGTERM)}
    try:
        with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
            futures = {pool.submit(synthesize, entry, engines[index % len(engines)]): entry for index, entry in enumerate(work)}
            consume_generation(futures, interrupted, on_success, on_failure, on_progress)
    finally:
        # In-flight successes have durable per-clip journals even if the batch
        # checkpoint cannot be written; the next invocation recovers them.
        try:
            checkpoint()
        finally:
            for signum, handler in old_handlers.items():
                signal.signal(signum, handler)
    if interrupted.is_set():
        print('Stopped; completed recordings are preserved. Run the same command to resume.', flush=True)
        return 130
    if failures:
        failed_path = paths['directory'] / 'failures.json' if args.work_dir else Path(tempfile.gettempdir()) / 'n1-audio-failures.json'
        atomic_json(failed_path, failures)
        print(f'Failed clips: {failed_path}', flush=True)
        return 1
    print(f"Complete: {len(current) == len(plan['entries'])}; audio files: {len(current)}; bytes: {sum(item['bytes'] for item in current.values())}", flush=True)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
