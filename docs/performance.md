# Learning app performance and recovery

## Runtime data boundaries

The initial catalog contains navigation metadata and the latest verified lesson.
Historical lessons remain separate hashed JSON assets. A lightweight compound
catalog supplies word links without importing full compound or live-unit content.

Audio metadata is emitted per `lesson/DATE`, `live/UNIT`, and `compound/SERIES`.
`AudioScope` loads the active scope, deduplicates concurrent requests, caches
successful responses, and permits failed requests to retry. Recording IDs,
providers, immutable URLs and durations remain unchanged. An archive shard
retains published recordings that no longer have a current teaching reference;
the normal interface does not request that shard.

The first screen retains only the global availability summary. Loading metadata
is distinct from an actual missing recording, so a pending request does not
label a published recording as waiting for synthesis.

The lesson search payload uses a versioned string table. Original and normalized
text remain available; compact matching text is reconstructed after decoding.
Legacy search payloads remain readable by release verification. A smaller
search-only projection keeps compound/live candidates available when the daily
index cannot load. Its normalization waits until the first nonempty query.
Ranking, IME handling, all-result access, keyboard selection and original anchors
remain shared with the existing search implementation.

## Build budgets

`scripts/lib/browserDataBudget.ts` checks every statically reachable initial JS
chunk, including imported chunks. Full audio maps, full live/compound datasets and
source snapshots may not return to that graph. Current limits allow growth through
the existing 99-day plan:

| Resource | Raw limit | gzip limit |
| --- | ---: | ---: |
| Initial JavaScript | 1,100,000 bytes | 360,000 bytes |
| Daily search index | 8,000,000 bytes | 1,900,000 bytes |

A failure should prompt an import/payload review before a budget increase. File
size comparisons are not measurements of LCP, INP or real-device startup time.
The release manifest lists and hashes all emitted audio metadata. Deployment
verification also validates the decoded scope and search references.

## Navigation and recovery

`useAppNavigation` uses the same parser for startup, hash changes and browser
history. Ordinary selections are represented by `date` and `section` parameters.
Existing `#practice/DATE/CATEGORY/ID`, `#compound-verbs/SERIES` and
`?live-unit=UNIT#live-reactions` links remain valid.

Lazy pages have error boundaries. Missing/retired lesson or audio metadata offers
an explicit page refresh; temporary failures offer retry. Refresh keeps the URL
and search query. Unsubmitted answer drafts use tab-local session storage with a
content/history revision, never enter scored progress or backups, and are cleared
after submission/cancellation. Blocked tab storage does not prevent answering.

Page markup lives in `src/pages`. `App` coordinates navigation, saved learning
state and focus. The content shell owns outer module edges; learning cards and
review styles own their internal layout.

## Learning-record replay

Attempt signature counts are aggregated once per stored history. A synchronous
update can reuse parsed values only while the raw bytes remain identical; it still
reads keys and bytes again to observe concurrent tabs. This temporary cache is
discarded after the update. Journal formats, old duplicate records and failed-write
recovery are preserved. Journals are not deleted or compacted without an explicit
old-tab/operation-acknowledgement design.

## Verification and CI reuse

The complete date/question isolation matrix runs against `getLessonReviewItems`,
the same selector used by the UI. Browser tests retain each historical date's
category links and all legacy answer/identity checks, plus representative cross-day
navigation, return, retry and reload paths.

Automatic sync can seal a fully tested build for its exact source tree and release
commit. Pages verifies the source repository, workflow, branch, run attempt, each
successful gate, parent relationship, checkout tree and every artifact byte before
reuse. Missing or mismatched proof falls back to all normal Pages checks. Every
Pages run still retains its own release manifest and verifies the actual live
files after deployment. See `docs/automation/README.md` for the full contract.

Useful checks:

```sh
npm run validate:content
npm test
node --test scripts/n1-automation.test.mjs
npm run build
npm run test:e2e
```

`tests/optimization.spec.ts` covers refresh/draft recovery, bad links, failed lazy
modules, retired lesson metadata, scoped audio loading/retry, external live-unit
history and common content edges on desktop and mobile.
