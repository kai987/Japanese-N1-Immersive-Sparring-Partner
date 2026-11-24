# Repository editing rules

## 直播条反 / Live reaction notes

Before adding or editing a live reaction unit, read [docs/live-note-identities.md](docs/live-note-identities.md) and inspect existing data and rendering tests.

- The source transcript is archival by default. Do NOT duplicate it as a source quotation above vocabulary/grammar entries. Preserve the raw source, stable IDs, and all audio references.
- Render a source quotation only when it adds genuinely independent context, with an explicit non-empty `source.contextReason`. Do not extend the frozen historical compatibility list or introduce per-date hide lists. The shared visibility rule must remain date-independent for new groups.
- Integrate meaningful corrections, fragment qualifications and nuances in the entries/notes/usage explanations before archiving a repeated source. Retain the manga reader separately.
- Use the shared `getVisibleLiveSource` for both display and search. Never bypass the duplicate-quote guard or the build validation.
- Run the content, unit, build and browser tests before publication, including the automatic coverage for newly registered units. Preserve the existing audio queue and release contract.

For daily N1 source/lesson automation follow [docs/automation/README.md](docs/automation/README.md) and its policy file; these rules do not change the daily schedule or content contract.
