# N1 offline audio audit

From the repository root, use Node 24, Cargo and a current stable Rust compiler.
The comparison runs the production snapshot validator and the Rust CLI against
the same checkout. The PR/dispatch workflow uses the same command.

```sh
npm ci
npm run audio:compare
node --test tools/n1-tool/fixtures.test.mjs
```

To run the CLI on its own, export the catalog once and keep it with the source revision it describes.

```sh
node scripts/collect-audio.ts /tmp/n1-catalog.json
cargo build --locked --release --manifest-path tools/n1-tool/Cargo.toml
tools/n1-tool/target/release/n1-tool --root . --catalog /tmp/n1-catalog.json
```

The exporter resolves TypeScript lessons and notes, uses the existing Japanese
sentence segmenter, normalizes speech and assigns IDs. Rust receives canonical
speech and independently checks the two wrapping 32-bit hashes over UTF-16 code
units. It cross-checks catalog bindings, protected supplementary references,
manifest/index identity and duration, hosted object paths, provider totals and
the persisted queue. A published archive may contain recordings that have no
current teaching reference.

The default audits a **published snapshot**. Newly imported lessons and correctly
queued new notes can still need speech. Add `--current` to fail on any current
missing ID. Any present local MP3 must match the manifest length and SHA-256.
Add `--local` to require every MP3. Without a local file, the CLI checks hosted
metadata and immutable addressing. Remote downloads, decoding and browser
playback belong to the existing online verification.

A successful audit prints one JSON object and exits 0. Data or file failures
print `{"valid":false,"error":"…"}` and exit 1. Invalid command arguments exit 2.
The report includes current and published counts, reference uses beyond the
first per ID, missing IDs, the number of local files hashed
(`localFilesHashed`), provider reuse/upload totals, and groups of distinct
published IDs declaring the same byte digest. These groups are informational.

The comparison checks common totals, the missing ID list and provider arithmetic.
The additional Rust diagnostics include duplicate JSON identity keys, duplicate or
conflicting current references and stale queue entries. This sidecar can
therefore flag malformed input even when the production snapshot check accepts
it. The existing TypeScript validator remains the publication gate.

## Full-data comparison on November 22

At `b2d88b6`, both tools reported 9,650 published clips, 9,817 current IDs,
169 missing IDs and 329,810,538 manifest bytes. The catalog used 15,486
references. The hosted summary contained 1,777 daily reuses and 7,873 uploads.
No published MP3 was present locally in this checkout. Byte-level validation
was exercised with both an intact and a corrupted local fixture.

On an M1 Pro, five sequential runs using fresh processes and warm filesystem
caches gave medians of 738 ms to export the catalog, 67 ms for the compiled
Rust CLI with that export and 868 ms for the existing TypeScript snapshot
command including collection. The median paired export-plus-Rust time was
804 ms. Build time, network access and audio generation were outside the
measurement.
