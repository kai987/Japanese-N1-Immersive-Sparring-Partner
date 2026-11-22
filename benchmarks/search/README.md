# Browser search benchmark

The three variants call the project's search function, including its 12-query
cache, note scoring and snippet generation. Each context loads the complete
packed lesson index and note projection once. The WASM variant substitutes
only the lesson scoring and sorting module at benchmark build time. It keeps
normalized fields and UTF-16 units resident, receives the prepared query and
returns lesson and chunk indices, scores and hit counts. TypeScript handles
note ranking, snippets, normalization and display in all three variants.

## Run

Use Node 24, Rust with the Wasm target and the wasm-bindgen CLI matching the
benchmark crate's locked version.

```sh
npm ci
npx playwright install chromium
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.114 --locked
npm run bench:search
```

The command builds the app and experimental engines locally, starts a loopback
server, runs Chromium, prints JSON and cleans up its temporary server root.
The Rust build and generated bindings are ignored by Git. To save just the
measurements after a build, run `node benchmarks/search/run.mjs > result.json`.
`N1_BENCH_ROUNDS` sets the number of fresh contexts per variant (default 24).

## Method

Variants rotate order between rounds. Each of the 24 queries appears once as
the first query to a fresh engine. Each remaining query runs once per context,
followed by an immediate repeat to exercise the cache. Samples include Japanese
and Chinese phrases, short/common and absent terms, multi-token inputs,
half-width kana, combining marks and supplementary characters. On the first
round the runner also compares **all** ranked results (order, anchors, scores,
counts and snippets) with the main-thread reference outside timed queries.

Initialization includes local fetch, JSON parsing, index preparation, Worker
startup and WASM initialization where applicable. The comparison harness
renders identical four-result-per-category previews. Compute measures the
search call. Input-to-frame ends on the second animation frame after the DOM
update, a presentation proxy. A posted main-thread task measures how soon the
page can handle independent work during a search. JS heap is CDP used heap
after forced GC, summed across page and Worker. WASM linear memory is reported
separately. Download sizes are gzip estimates for the benchmark engine files
only. Common index, notes and harness code are excluded from the engine totals.

The runner additionally exercises the real production React search at a 390 ×
844 viewport, checking candidate identity and order for each query before the
frame observation. The comparison harness has a smaller DOM than the React
popup. All timings use headless desktop Chromium on loopback without CPU or
network throttling. These measurements characterize this machine and corpus.

## November 22 measurements

Apple M1 Pro, macOS 27.2.1, Node 24.18.0, Chromium 151.0.7922.34. Source data
at `b2d88b6` comprised 84 lessons, 6,353 chunks and 14,908 string-table entries.
The lesson index was 5,662,765 bytes raw and 1,379,698 bytes gzipped. All 24
full-result comparisons passed. Times below are median / P95 milliseconds, with
24 cold and 552 subsequent distinct queries per variant.

| Measurement | TS main | TS Worker | WASM + Worker |
| --- | ---: | ---: | ---: |
| Initialize | 56.9 / 79.2 | 57.6 / 69.6 | 82.1 / 88.7 |
| First query compute | 8.3 / 15.0 | 7.6 / 14.2 | 6.8 / 12.5 |
| Subsequent compute | 2.9 / 6.4 | 2.9 / 6.6 | 2.9 / 7.1 |
| Input to preview frame | 15.6 / 16.9 | 15.7 / 21.0 | 15.7 / 23.1 |
| Main-thread task delay | 3.0 / 6.7 | 0.1 / 0.2 | 0.1 / 0.2 |
| Cached query compute | 0.4 / 2.1 | 0.4 / 1.9 | 0.5 / 2.1 |
| Median JS heap (MiB) | 7.82 | 8.08 | 5.59 |
| WASM linear memory (MiB) | 0 | 0 | 10.69 |
| Engine bytes (gzip) | 5,063 | 5,063 | 23,070 |

The production React page's warm input-to-frame result was **13.1 / 14.9 ms**
across 23 distinct queries. Keep TypeScript on the main thread for the current
release. Both Workers freed the main thread earlier, but neither improved the
measured warm preview P95. WASM also added 18,007 compressed engine bytes and
a second resident representation of the search data. A slower target device
or a larger future corpus warrants rerunning the same comparison.

[Machine-readable benchmark results](results/2026-11-22-m1-pro.json)
