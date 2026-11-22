use anyhow::{Context, Result, ensure};
use clap::Parser;
use serde::{
    Deserialize, Serialize,
    de::{DeserializeOwned, Error, MapAccess, Visitor},
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, BTreeSet},
    fmt, fs,
    marker::PhantomData,
    path::{Path, PathBuf},
    process::ExitCode,
};
use url::Url;

#[derive(Parser)]
#[command(about = "Audit an exported N1 speech catalog against the published audio snapshot")]
struct Args {
    /// JSON produced by npm run audio:catalog -- <file>
    #[arg(long)]
    catalog: PathBuf,
    /// Repository containing public/audio and src/data
    #[arg(long, default_value = ".")]
    root: PathBuf,
    /// Require recordings for every reference, including new lessons
    #[arg(long)]
    current: bool,
    /// Require and hash every local MP3, even when it is hosted
    #[arg(long)]
    local: bool,
}

type Map<T> = BTreeMap<String, T>;

// JSON object keys are identities. Silently accepting a second value loses evidence.
fn unique_map<'de, D, T>(deserializer: D) -> Result<Map<T>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: Deserialize<'de>,
{
    struct Unique<T>(PhantomData<T>);
    impl<'de, T: Deserialize<'de>> Visitor<'de> for Unique<T> {
        type Value = Map<T>;
        fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
            f.write_str("a map of distinct keys")
        }
        fn visit_map<A: MapAccess<'de>>(self, mut src: A) -> Result<Self::Value, A::Error> {
            let mut out = Map::new();
            while let Some((key, val)) = src.next_entry::<String, T>()? {
                if out.contains_key(&key) {
                    return Err(A::Error::custom(format!("duplicate key {key}")));
                }
                out.insert(key, val);
            }
            Ok(out)
        }
    }
    deserializer.deserialize_map(Unique(PhantomData))
}
fn read_snapshot<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Option<Map<String>>, D::Error> {
    unique_map(d).map(Some)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Catalog {
    version: u8,
    voice: Value,
    entries: Vec<Entry>,
}
#[derive(Deserialize)]
struct Entry {
    id: String,
    text: String,
    label: String,
    references: Vec<String>,
}
#[derive(Deserialize)]
struct Clip {
    #[serde(flatten)]
    entry: Entry,
    duration: f64,
    bytes: u64,
    sha256: String,
    rms: f64,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    version: u8,
    voice: Value,
    model_version: String,
    expected_clips: usize,
    complete: bool,
    lesson_dates: BTreeSet<String>,
    #[serde(deserialize_with = "unique_map")]
    clips: Map<Clip>,
    #[serde(default, deserialize_with = "read_snapshot")]
    non_lesson_snapshot: Option<Map<String>>,
}
#[derive(Deserialize)]
struct Index {
    version: u8,
    voice: Value,
    #[serde(deserialize_with = "unique_map")]
    clips: Map<f64>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Queue {
    version: u8,
    voice: Value,
    required_clips: usize,
    pending_clips: usize,
    entries: Vec<Entry>,
}
#[derive(Deserialize)]
struct Hosted {
    provider: String,
    path: String,
    sha256: String,
    bytes: u64,
    duration: f64,
}
#[derive(Deserialize)]
struct SourceRevision {
    commit: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Sources {
    version: u8,
    voice: Value,
    model_version: String,
    complete: bool,
    verified_at: Option<String>,
    providers: Map<String>,
    shared_source: SourceRevision,
    summary: Totals,
    #[serde(deserialize_with = "unique_map")]
    clips: Map<Hosted>,
}
#[derive(Default, Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
struct Totals {
    total: usize,
    uploads: usize,
    reused: usize,
    upload_bytes: u64,
    saved_bytes: u64,
}

fn read<T: DeserializeOwned>(path: &Path) -> Result<T> {
    serde_json::from_slice(&fs::read(path).with_context(|| path.display().to_string())?)
        .with_context(|| format!("invalid JSON or schema in {}", path.display()))
}
fn hex(s: &str, n: usize) -> bool {
    s.len() == n
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
// Input is the canonical speech emitted by collectAudio. Normalization and sentence
// segmentation stay in Node. JS charCodeAt iterates UTF-16 units, including surrogates.
fn audio_id(text: &str) -> String {
    let (mut a, mut b) = (0x811c9dc5u32, 0x9e3779b9u32);
    for c in "497929760|1|24000|mp3-64k|"
        .encode_utf16()
        .chain(text.encode_utf16())
    {
        a = (a ^ u32::from(c)).wrapping_mul(0x01000193);
        b = (b ^ u32::from(c)).wrapping_mul(0x85ebca6b);
    }
    format!("{a:08x}{b:08x}")
}
fn note_ref(s: &str) -> bool {
    let mut parts = s.splitn(3, '/');
    matches!(parts.next(), Some("live" | "compound"))
        && parts.next().is_some_and(|x| !x.is_empty())
        && parts.next().is_some_and(|x| !x.is_empty())
        && !s.bytes().any(|b| b < 32)
}
fn lesson_ref(s: &str) -> bool {
    let Some(rest) = s.strip_prefix("lesson/") else {
        return false;
    };
    let Some((date, key)) = rest.split_once('/') else {
        return false;
    };
    date.len() == 10
        && chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d").is_ok()
        && !key.is_empty()
        && !s.bytes().any(|b| b < 32)
}
fn valid_entry(e: &Entry) -> Result<()> {
    ensure!(
        !e.text.is_empty() && e.id == audio_id(&e.text),
        "speech ID mismatch {}",
        e.id
    );
    ensure!(
        !e.label.is_empty() && !e.references.is_empty(),
        "missing label/references {}",
        e.id
    );
    let mut seen = BTreeSet::new();
    for r in &e.references {
        ensure!(
            (lesson_ref(r) || note_ref(r)) && seen.insert(r),
            "invalid or duplicate reference {r} ({})",
            e.id
        );
    }
    Ok(())
}
fn daily_path(s: &Hosted) -> bool {
    let p: Vec<_> = s.path.split('/').collect();
    if p.len() != 3
        || p[0] != "japanese"
        || p[1].len() != 10
        || chrono::NaiveDate::parse_from_str(p[1], "%Y-%m-%d").is_err()
    {
        return false;
    }
    p[2].strip_suffix(&format!("--{}.mp3", s.sha256))
        .is_some_and(|name| {
            !name.is_empty()
                && name
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_'))
        })
}

fn validate_sources(m: &Manifest, s: &Sources) -> Result<()> {
    ensure!(
        s.version == 1 && s.voice == m.voice && s.model_version == m.model_version,
        "hosted voice/model mismatch"
    );
    ensure!(hex(&s.shared_source.commit, 40), "invalid upstream commit");
    for url in s.providers.values() {
        let u = Url::parse(url)?;
        ensure!(
            u.scheme() == "https"
                && u.host().is_some()
                && u.username().is_empty()
                && u.password().is_none()
                && u.query().is_none()
                && u.fragment().is_none()
                && u.path().ends_with('/'),
            "invalid provider URL"
        );
    }
    if !s.complete {
        return Ok(());
    }
    chrono::DateTime::parse_from_rfc3339(
        s.verified_at
            .as_deref()
            .context("missing verification time")?,
    )?;
    ensure!(
        s.clips.keys().eq(m.clips.keys()),
        "hosted IDs differ from manifest"
    );
    let mut totals = Totals::default();
    for (id, h) in &s.clips {
        let clip = &m.clips[id];
        ensure!(
            h.duration >= 0.12
                && (512..=(1u64 << 53) - 1).contains(&h.bytes)
                && hex(&h.sha256, 64)
                && s.providers.contains_key(&h.provider),
            "bad hosted record {id}"
        );
        match h.provider.as_str() {
            "daily" => {
                ensure!(daily_path(h), "invalid immutable daily path {id}");
                totals.reused += 1;
                totals.saved_bytes = totals
                    .saved_bytes
                    .checked_add(clip.bytes)
                    .context("saved byte total overflow")?;
            }
            "supabase" => {
                ensure!(
                    h.path == format!("morioki-normal/{id}--{}.mp3", clip.sha256)
                        && h.sha256 == clip.sha256
                        && h.bytes == clip.bytes
                        && h.duration == clip.duration,
                    "immutable object mismatch {id}"
                );
                totals.uploads += 1;
                totals.upload_bytes = totals
                    .upload_bytes
                    .checked_add(h.bytes)
                    .context("upload byte total overflow")?;
            }
            _ => anyhow::bail!("unknown provider for {id}"),
        }
        totals.total += 1;
    }
    ensure!(s.summary == totals, "dedup totals differ: {totals:?}");
    Ok(())
}

fn validate_recordings(
    args: &Args,
    m: &Manifest,
    index: &Index,
    sources: &Sources,
) -> Result<(u64, usize)> {
    let mut byte_count = 0u64;
    let mut local_files = 0;
    for (id, c) in &m.clips {
        valid_entry(&c.entry)?;
        ensure!(
            c.entry.id == *id
                && c.duration >= 0.12
                && c.rms >= 0.0005
                && hex(&c.sha256, 64)
                && (512..=(1u64 << 53) - 1).contains(&c.bytes)
                && index.clips[id] == c.duration,
            "invalid recording {id}"
        );
        if let Some(snapshot) = &m.non_lesson_snapshot {
            for r in c
                .entry
                .references
                .iter()
                .filter(|r| !r.starts_with("lesson/"))
            {
                ensure!(snapshot.get(r) == Some(id), "missing protected binding {r}");
            }
        }
        let path = args
            .root
            .join("public/audio/morioki-normal")
            .join(format!("{id}.mp3"));
        if args.local || !sources.complete || path.try_exists()? {
            let data = fs::read(&path).with_context(|| path.display().to_string())?;
            ensure!(
                data.len() as u64 == c.bytes && format!("{:x}", Sha256::digest(&data)) == c.sha256,
                "local file differs {id}"
            );
            local_files += 1;
        }
        byte_count = byte_count
            .checked_add(c.bytes)
            .context("byte total overflow")?;
    }
    if let Some(snapshot) = &m.non_lesson_snapshot {
        for (r, id) in snapshot {
            ensure!(
                note_ref(r) && m.clips.contains_key(id),
                "invalid protected binding {r}"
            );
        }
    }
    Ok((byte_count, local_files))
}

fn validate_queue(
    root: &Path,
    m: &Manifest,
    current: &Map<&Entry>,
    missing: &[&Entry],
) -> Result<()> {
    let queue_path = root.join("src/data/audio-pending.json");
    let mut queued = BTreeSet::new();
    let mut queued_refs = BTreeSet::new();
    if queue_path.try_exists()? {
        let q: Queue = read(&queue_path)?;
        ensure!(
            q.version == 1
                && q.voice == m.voice
                && q.pending_clips == q.entries.len()
                && q.required_clips >= q.pending_clips,
            "invalid queue header"
        );
        for e in q.entries {
            let actual = current.get(&e.id).context("unknown queued ID")?;
            ensure!(
                queued.insert(e.id.clone())
                    && !m.clips.contains_key(&e.id)
                    && e.text == actual.text
                    && !e.references.is_empty(),
                "invalid queued identity {}",
                e.id
            );
            for r in e.references {
                ensure!(
                    actual.references.contains(&r) && queued_refs.insert(r),
                    "invalid queued reference {}",
                    e.id
                );
            }
        }
    }
    for e in missing {
        for r in e.references.iter().filter(|r| !r.starts_with("lesson/")) {
            ensure!(queued_refs.contains(r), "new note is not queued {r}");
        }
    }
    Ok(())
}

fn audit(args: &Args) -> Result<Value> {
    let root = &args.root;
    let catalog: Catalog = read(&args.catalog)?;
    let m: Manifest = read(&root.join("public/audio/manifest.json"))?;
    let index: Index = read(&root.join("src/data/audio-index.json"))?;
    let sources: Sources = read(&root.join("src/data/audio-sources.json"))?;
    let voice = json!({"engine":"AivisSpeech","name":"morioki","style":"ノーマル","styleId":497929760,
        "speakerUuid":"396a746d-742f-4e43-b722-1182a7fab9af","speed":1,"sampleRate":24000,"codec":"mp3-64k"});
    ensure!(
        catalog.version == 1
            && m.version == 1
            && index.version == 1
            && catalog.voice == voice
            && m.voice == voice
            && index.voice == voice,
        "invalid version or voice"
    );
    ensure!(
        m.complete && m.expected_clips == m.clips.len(),
        "incomplete recording manifest"
    );
    ensure!(
        index.clips.keys().eq(m.clips.keys()),
        "index IDs differ from manifest"
    );
    validate_sources(&m, &sources)?;
    let (byte_count, local_files) = validate_recordings(args, &m, &index, &sources)?;
    let mut current = Map::new();
    let mut bindings = BTreeSet::new();
    let mut missing = Vec::new();
    for e in &catalog.entries {
        valid_entry(e)?;
        ensure!(
            current.insert(e.id.clone(), e).is_none(),
            "duplicate catalog ID {}",
            e.id
        );
        for r in &e.references {
            ensure!(bindings.insert(r), "conflicting catalog reference {r}");
            if let Some(id) = m.non_lesson_snapshot.as_ref().and_then(|s| s.get(r)) {
                ensure!(*id == e.id, "protected reference changed {r}");
            }
        }
        if let Some(c) = m.clips.get(&e.id) {
            ensure!(c.entry.text == e.text, "catalog speech mismatch {}", e.id);
        } else {
            for r in &e.references {
                if r.starts_with("lesson/") {
                    ensure!(
                        !m.lesson_dates.contains(r.split('/').nth(1).unwrap_or("")),
                        "missing published speech {r}"
                    );
                } else {
                    ensure!(m.non_lesson_snapshot.is_some(), "missing legacy note {r}");
                }
            }
            missing.push(e);
        }
    }
    validate_queue(root, &m, &current, &missing)?;
    ensure!(
        !args.current || missing.is_empty(),
        "{} current clips missing",
        missing.len()
    );
    let mut ids_by_hash: Map<Vec<&str>> = Map::new();
    for (id, clip) in &m.clips {
        let digest = if sources.complete {
            &sources.clips[id].sha256
        } else {
            &clip.sha256
        };
        ids_by_hash.entry(digest.clone()).or_default().push(id);
    }
    ids_by_hash.retain(|_, ids| ids.len() > 1);
    Ok(json!({
        "valid": true,
        "clips": m.clips.len(),
        "expected": current.len(),
        "references": bindings.len(),
        "sharedReferences": bindings.len() - current.len(),
        "localFilesHashed": local_files,
        "hosted": if sources.complete { sources.clips.len() } else { 0 },
        "dedup": if sources.complete { Some(&sources.summary) } else { None },
        "duplicateByteGroups": ids_by_hash,
        "missing": missing.len(),
        "missingIds": missing.iter().map(|entry| &entry.id).collect::<Vec<_>>(),
        "bytes": byte_count
    }))
}
fn main() -> ExitCode {
    match audit(&Args::parse()) {
        Ok(report) => {
            println!("{report}");
            ExitCode::SUCCESS
        }
        Err(e) => {
            println!("{}", json!({"valid":false,"error":format!("{e:#}")}));
            ExitCode::FAILURE
        }
    }
}
