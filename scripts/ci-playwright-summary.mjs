import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const path = process.argv[2]
if (!path || !existsSync(path)) {
  console.log('No Playwright JSON report was produced.')
} else {
  const report = JSON.parse(readFileSync(path, 'utf8'))
  const rows = []
  function visit(suite, titles = []) {
    const next = [...titles, suite.title].filter(Boolean)
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const results = test.results ?? []
      rows.push({ file: spec.file || suite.file || '', title: [...next, spec.title].filter(Boolean).join(' › '),
        status: test.status, duration: results.reduce((sum, result) => sum + (result.duration || 0), 0) })
    }
    for (const child of suite.suites ?? []) visit(child, next)
  }
  for (const suite of report.suites ?? []) visit(suite)
  const safe = text => String(text).replace(/[|\r\n]/g, ' ').replace(/</g, '&lt;').slice(0, 220)
  const files = new Map()
  for (const row of rows) files.set(row.file, (files.get(row.file) ?? 0) + row.duration)
  const stats = report.stats ?? {}
  const markdown = ['### Playwright timings',
    `Tests: ${rows.length}; passed/expected: ${stats.expected ?? 0}; unexpected: ${stats.unexpected ?? 0}; flaky: ${stats.flaky ?? 0}; skipped: ${stats.skipped ?? 0}; elapsed: ${((stats.duration ?? 0)/1000).toFixed(1)}s.`,
    '', '| Slowest files (sum of test durations) | Seconds |', '| --- | ---: |',
    ...[...files].sort((a,b) => b[1]-a[1]).slice(0,10).map(([file, ms]) => `| ${safe(file)} | ${(ms/1000).toFixed(1)} |`),
    '', '| Slowest tests | Seconds |', '| --- | ---: |',
    ...rows.sort((a,b) => b.duration-a.duration).slice(0,10).map(row => `| ${safe(row.title)} | ${(row.duration/1000).toFixed(1)} |`), ''].join('\n')
  console.log(markdown)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n')
}
