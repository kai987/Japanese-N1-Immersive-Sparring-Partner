# N1 automation: shared authoring, synchronization and recovery contract

Effective 2026-09-23. Read this document and policy.json before every 09:00, 11:00 or recovery invocation. These rules consolidate existing requirements; no content, evidence, dedupe, privacy or deployment gate is weakened. Technical source schemas and the upstream learning-review module remain authoritative for their fields.

## Entry points and durable state

09:00 creates the original; 11:00 prepares the synchronized lesson; N1 recovery runs ONCE daily at 12:00 Asia/Tokyo, never hourly. The plan is 2026-08-30=Day1 through 2026-12-06=Day99. After the end, do not create Day100, a negative countdown or a replacement plan without approval. Recovery may still finish pending in-plan dates. Recover every due date from 2026-09-19 plus earlier explicitly pending dates, using a complete calendar/file inventory, not just existing files. Read failures or truncation are not proof of absence.

Normal sync, recovery and upstream handoff submit the SAME complete `.github/n1-sync-request.json`; `.github/workflows/sync-n1-daily.yml` is the normal writer of final daily JSON and snapshot. Do not maintain another normal direct-to-JSON writer. Before submitting a request, inspect live sync and Pages runs; do not replace an active request. Preserve pending dates in `automation/n1-progress:runs/DATE/sync-status.json` and completed request drafts in `runs/DATE/request.json`. One shared request slot is not a durable queue. Drain oldest pending dates without discarding another date's request; freeze targetDate across midnight.

Request-file pushes start the workflow. workflow_dispatch/repository_dispatch may replay a matching, already complete request. A callback is only a hint; it cannot create missing lesson content or rebind an old request to another commit/date. waiting_request/waiting_matching_request is not publication success.

## Checkpoint the exact original before promotion

Read n1-plan.md. Generate the complete public teaching text once: original immersion material, learning plan, minimum completion line, adjustment conditions and 3–5 review questions. Do not put individual scores, private answer history, fatigue/health details, email or private tool records in the public repository, including progress branches. Keep personalized feedback outside the public teaching text in the private response/store.

Stage exact final source bytes, not a summary:

```sh
node scripts/n1-automation.mjs stage YYYY-MM-DD 'REAL_TIMESTAMP+09:00' /tmp/source.md /tmp/source.json
```

Create automation/n1-progress once from known main if absent; never force-reset it. Save this record as runs/DATE/source.json on that branch using latest blob SHA/CAS. Read back and verify targetDate, Day, bytes, sha256, real timestamp and exact markdown. A different existing original is a correction conflict, not permission to regenerate. Do not invent an old generatedAt timestamp.

```sh
node scripts/n1-automation.mjs restore /tmp/source.json /tmp/n1-checkout
```

The helper creates only n1-source/DATE.md, does nothing for identical bytes and refuses to overwrite another original. Commit those exact bytes to main with latest SHA/non-force protection; read back and compare the checkpoint hash. This helper performs local validation/materialization, NOT GitHub API calls: use actual discovered connector actions for remote writes. A verified outbox plus failed main write means source_pending_promotion, not source_saved. Send the same public teaching text to the user; status/private commentary is separate.

At 11:00/noon, when main source is missing, recover the complete outbox record, verify and promote it before mapping. If neither original nor checkpoint is readable, keep source_missing; never reconstruct from memory, templates, yesterday or excerpts. If all authorized persistence fails during authoring, still provide the full lesson and a real full-text attachment; state that no recoverable remote record exists. A later task cannot be assumed to read an unattached local path. Use at most three evidenced transient attempts; never bypass 401/403 or leak private data to a public fallback.

## Source-bound mapping and learning rules

Read src/data/daily/README.md, src/types.ts, src/lib/archive.ts, src/lib/itStudy.ts and the actual importers. Read the complete target-date n1-source and retain its blob SHA. Date/Day must agree. Title/subtitle, immersion Japanese/Chinese/analysis, reading and reviewFocus come only from that original. If no ready single reading question exists, derive one main-idea question from the same material, without external facts. Four options and optionNotes, answer index 0–3. Do not pre-reveal answers in reviewFocus; keep legitimate independent old-question review.

Upstream is kai987/japan-it-ai-daily. Lock a completed successful main .github/workflows/deploy.yml commit; read that commit's target-date daily/daily-ja/japanese/japanese-ja, evidence and structured interviews, schemas, identity rules and learning-review module/README. Code-only, audio-upload or draft success does not publish a missing report. Preserve Top5 identity/order/facts, C-4 membership, real levels, examples and every detailed card field.

Fetch the exact successful workflow's it-study-snapshot or a byte-verified equivalent. Verify sourceCommit=head_sha, target date, full report-date coverage, issueNumbers, totalDays, lastDate and complete grammarLessons against all complete upstream reports. A historical backfill may use the newest verified snapshot covering its date, but cannot roll back local dates/statistics. Rebuilt bytes must match the locked hash; source equality alone is insufficient. JSON comparison may account for omitted undefined fields, never ignore genuine differences.

Raw src/data/daily/DATE.json contains only the target C-4 NEW subset: at most ten vocabulary and min(5,newGrammarCount) grammar, in source order. Preserve reading, meaning, partOfSpeech, levels, collocations, example/translation/nuance, form/register/comparison, sourceUrl/sourceForm/sourceAnchor and source commit. Fewer than five new grammar requires a truthful >=20-character grammarSelectionNote naming the NEW count. grammar:[] is legal with explanation; missing source is not. New lessons use merged=false. Same date/content/reading/example reuses ID; semantic changes or changed questions/options require a new identity, never position-based reuse.

import:study and itStudy derive full NEW+REVIEW from the SAME upstream snapshot. Vocabulary target20; grammar5–8, eight only a ceiling. Genuine shortages including0–4 require reviewGrammarNote/reviewVocabularyNote where relevant. Review requires an earlier independent introduction and real target-day reviewEvidence; never manufacture qualifying prose. New/review cannot overlap. Keep real N2/N3 labels and full detailed cards. Grammar overlays start2026-09-09; full vocabulary supplementation starts2026-09-18. Preserve earlier independent lessons, immersion, raw vocabulary, reading, error queues and originals.

Full-history new-item canonical and semantic dedupe remains mandatory, not yesterday/N days/strings. Distinguish する上で/した上で, かねる/かねない, にかかわらず/にもかかわらず, つつ/つつも. Failed/truncated reads cannot mean zero duplicates. Frequency uses distinct saved IT-report dates/all actual IT-report dates, one decimal and date links; do not double-count mirrors, claim external-full-text coverage or use N1 Day as denominator. IT issueNumber and N1 Day differ. Preserve all user learning states and links.

## Request, validation and completion

Complete requests require targetDate, sourceCommit(40hex), sourceBlobSha(40hex), snapshotSha256(64hex), issueNumber, totalDays and complete daily. Calculate real hashes. Save the finished request draft on the progress branch, then update the shared request slot only when free, using latest SHA/CAS and non-force writes.

sync-n1-daily.yml verifies exact upstream Pages/build/post-deploy success, rebuilds/hash-checks the snapshot, checks source blob, runs import:study, validate:content, unit tests, build and Playwright. It commits only target JSON+snapshot under fast-forward protection and explicitly dispatches deploy-pages.yml. No-change import must still ensure a successful deployment. If main changes, reconcile and revalidate; never force-push or cancel legitimate deployment jobs.

Only exact N1 commit Pages success AND live target-date verification means published. Record targetDate/sourceCommit/releaseCommit/source hash/run IDs/counts/checks in progress, not in main just to trigger another deployment. Earlier states: waiting_source, source_pending_promotion, waiting_upstream, waiting_request, validating, awaiting_deploy, blocked. Notify actual counts and newly changed errors/recovery, not repeated unchanged status or entire reports. Never disable recurring tasks because of normal failure/success/source delay/no new grammar.

## Shared upstream lease and publication handoff

EVERY upstream writer, including N1 tasks, first uses upstream scripts/daily-publication.mjs claimLease/renewLease/assertLease with automation/daily-progress:locks/publisher.json. Latest SHA/CAS plus token read-back;45minTTL, renew at least every5min. Unreadable/live foreign locks prohibit writes. Acquire upstream before N1 request ownership; do not hold one repository while waiting for the other. Release upstream after verified publication, then continue N1 with the new exact commit.

Read failed run/job/step logs first, fix only evidenced direct causes and add regression tests. Never weaken schema, evidence, history, bilingual, quality, browser or security checks. Preserve unknown root causes as unknown.

After a NEWLY verified publication, the IT primary/recovery task performs this same handoff once if the corresponding N1 original exists and the date is pending. This is publication continuation, not an hourly N1 scan. If sources are missing, record the handoff blocker for the existing daily entrypoints. A separate optional GitHub success callback replays matching ready requests and requires cross-repository credentials; absent credentials or missing requests must never be called end-to-end automatic success.
