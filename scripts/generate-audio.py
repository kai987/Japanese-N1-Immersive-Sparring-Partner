#!/usr/bin/env python3
"""Generate resumable, content-addressed morioki recordings using local AivisSpeech."""
from __future__ import annotations
import argparse
import array
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import io
import json
import math
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
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)

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
    args = parser.parse_args()
    engines = args.engine or ['http://127.0.0.1:10101']
    for engine in engines:
        parsed = urllib.parse.urlparse(engine)
        if parsed.scheme not in ('http', 'https') or parsed.hostname not in ('127.0.0.1', 'localhost', '::1'):
            parser.error('Use a local AivisSpeech engine; remote synthesis is not supported.')
    with tempfile.TemporaryDirectory(prefix='n1-audio-') as work:
        plan_path = Path(work) / 'plan.json'
        subprocess.run(['node', 'scripts/collect-audio.ts', str(plan_path)], cwd=ROOT, check=True)
        plan = json.loads(plan_path.read_text())
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
    output = ROOT / 'public/audio/morioki-normal'
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'public/audio/manifest.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    if previous and previous.get('voice') != voice:
        raise RuntimeError('Existing audio uses a different voice configuration; preserve it and choose a new output directory.')
    previous_clips = previous.get('clips', {})
    sources_path = ROOT / 'src/data/audio-sources.json'
    sources = json.loads(sources_path.read_text()) if sources_path.exists() else {}
    hosted_clips = sources.get('clips', {}) if hosted_cache_matches(previous, sources) else {}
    same_model = previous.get('modelVersion') == actual['version'] and previous.get('engineVersion') == engine_version
    current = {}
    missing = []
    for entry in plan['entries']:
        path = output / f"{entry['id']}.mp3"
        old = previous_clips.get(entry['id'])
        if reusable_clip(entry, old, path, same_model, hosted_clips):
            current[entry['id']] = {**old, 'references': entry['references']}
        else:
            missing.append(entry)
    policy = request(engines[0], '/speaker_info', {'speaker_uuid': voice['speakerUuid']}, timeout=15)['policy']
    (ROOT / 'public/audio/morioki-license.txt').write_text(policy)
    if not missing and current == previous_clips:
        print(f"Complete: {len(current)} verified hosted/local recordings reused; nothing to generate.", flush=True)
        return 0
    interrupted = threading.Event()
    def handle_stop(signum, frame): interrupted.set()
    signal.signal(signal.SIGINT, handle_stop)
    signal.signal(signal.SIGTERM, handle_stop)
    failures = []
    started = time.monotonic()
    def checkpoint():
        metadata = {'version': 1, 'voice': voice, 'engineVersion': engine_version, 'modelVersion': actual['version'],
            'generatedAt': datetime.now(timezone.utc).isoformat(), 'lessonDates': plan['lessonDates'],
            'expectedClips': len(plan['entries']), 'complete': len(current) == len(plan['entries']),
            'clips': {key: current[key] for key in sorted(current)}}
        atomic_json(manifest_path, metadata)
        atomic_json(ROOT / 'src/data/audio-index.json', {'version': 1, 'voice': voice, 'clips': {key: current[key]['duration'] for key in sorted(current)}})
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
                encoded = temporary.read_bytes()
                temporary.replace(target)
                return {**entry, 'duration': round(measured, 3), 'bytes': len(encoded), 'sha256': hashlib.sha256(encoded).hexdigest(), 'rms': round(rms, 6)}
            except Exception:
                if attempt == 2: raise
                time.sleep(1 + attempt)
        raise AssertionError('unreachable')
    missing.sort(key=lambda entry: 0 if any(ref.startswith(('compound/', 'live/')) for ref in entry['references']) else 1)
    work = missing[:args.limit] if args.limit is not None else missing
    print(f"Voice verified: {actual['name']} / {voice['style']} ({voice['styleId']}); {len(current)} cached, {len(missing)} missing, {len(work)} queued", flush=True)
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
        futures = {pool.submit(synthesize, entry, engines[index % len(engines)]): entry for index, entry in enumerate(work)}
        for number, future in enumerate(as_completed(futures), 1):
            entry = futures[future]
            try:
                clip = future.result()
                if clip is not None: current[entry['id']] = clip
            except Exception as error:
                failures.append({'id': entry['id'], 'text': entry['text'], 'error': str(error)})
                print(f"FAILED {entry['id']}: {error}", flush=True)
            if interrupted.is_set():
                for pending in futures: pending.cancel()
                break
            if number % 20 == 0 or number == len(work):
                checkpoint()
                elapsed = time.monotonic() - started
                print(f"{len(current)}/{len(plan['entries'])} complete; {number}/{len(work)} this run; {elapsed:.1f}s; {len(failures)} failed", flush=True)
    checkpoint()
    if interrupted.is_set():
        print('Stopped; completed recordings are preserved. Run the same command to resume.', flush=True)
        return 130
    if failures:
        failed_path = Path(tempfile.gettempdir()) / 'n1-audio-failures.json'
        atomic_json(failed_path, failures)
        print(f'Failed clips: {failed_path}', flush=True)
        return 1
    print(f"Complete: {len(current) == len(plan['entries'])}; audio files: {len(current)}; bytes: {sum(item['bytes'] for item in current.values())}", flush=True)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
