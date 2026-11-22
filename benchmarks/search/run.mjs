// Builds experimental entries into a temporary preview only. Run from the repository root.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile, copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve, extname, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
import { chromium } from '@playwright/test'
import { createNoteSearchData } from '../../scripts/lib/noteSearchData.ts'
import { packProjectNotesIndex } from '../../src/lib/searchIndexCodec.ts'

const here = import.meta.dirname,
  dist = resolve('dist'),
  work = await mkdtemp(join(tmpdir(), 'n1-search-'))
const bench = join(work, 'bench'),
  crate = join(here, 'wasm'),
  generated = join(here, 'generated')
const queries = [
  '恨み',
  'ない',
  'の',
  '間に合う',
  'はなしあう',
  '期限',
  '受付',
  '読み取る',
  'いけない',
  '日语 不存在的查询',
  'ﾌｧﾝﾀｼﾞｰ',
  'カ\u3099',
  '𠮷野家',
  '😀',
  'ＡＩ',
  '経験 知識',
  'できません',
  '変更',
  'という',
  'abcdefghzzzz',
  '引用',
  '読 取',
  'ファンタジー',
  '～'
]
const modes = ['main', 'worker', 'wasm']
const rounds = Number(process.env.N1_BENCH_ROUNDS ?? 24)
assert(Number.isInteger(rounds) && rounds >= 2)
const samples = Object.fromEntries(modes.map((m) => [m, []])),
  reference = new Map(),
  previews = new Map()
const json = async (path) => JSON.parse(await readFile(path))
const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const q = (f) => Number(sorted[Math.ceil(f * sorted.length) - 1].toFixed(2))
  return { n: values.length, median: q(0.5), p95: q(0.95) }
}
let server, browser
try {
  await mkdir(bench)
  await mkdir(generated, { recursive: true })
  execFileSync(
    'cargo',
    [
      'build',
      '--manifest-path',
      join(crate, 'Cargo.toml'),
      '--locked',
      '--release',
      '--target',
      'wasm32-unknown-unknown'
    ],
    { stdio: 'inherit' }
  )
  execFileSync('wasm-bindgen', [
    '--target',
    'web',
    '--omit-default-module-path',
    '--out-dir',
    generated,
    join(crate, 'target/wasm32-unknown-unknown/release/n1_search_bench.wasm')
  ])
  await copyFile(join(generated, 'n1_search_bench_bg.wasm'), join(bench, 'ranking.wasm'))
  const release = await json(join(dist, 'n1-release.json'))
  const payload = await readFile(join(dist, release.searchIndex))
  const packed = JSON.parse(payload)
  await writeFile(join(bench, 'index.json'), payload)
  await writeFile(join(bench, 'notes.json'), JSON.stringify(packProjectNotesIndex(createNoteSearchData())))
  await copyFile(join(here, 'harness.html'), join(bench, 'index.html'))
  for (const engine of ['ts', 'wasm']) {
    const replacement = join(here, 'wasm-ranking.js')
    await build({
      configFile: false,
      publicDir: false,
      logLevel: 'warn',
      plugins: [
        {
          name: 'bench-kernel',
          resolveId(id) {
            if (id === 'bench:kernel') return engine === 'wasm' ? replacement : '\0bench-noop'
            if (engine === 'wasm' && id === './lessonRanking.ts') return replacement
          },
          load(id) {
            if (id === '\0bench-noop') return 'export function initializeKernel(){};export const linearBytes=()=>0'
          }
        }
      ],
      build: {
        outDir: bench,
        emptyOutDir: false,
        lib: { entry: join(here, 'engine.js'), formats: ['es'], fileName: () => engine + '.js' }
      }
    })
  }
  // Serve just these two roots, on loopback. Fresh contexts get cold HTTP caches.
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname
      const app = path.startsWith('/app/'),
        root = app ? dist : bench
      if (!app && !path.startsWith('/bench/')) {
        res.writeHead(404).end()
        return
      }
      const file = resolve(root, path.slice(app ? 5 : 7) || 'index.html')
      if (!file.startsWith(root + sep)) {
        res.writeHead(403).end()
        return
      }
      const bytes = await readFile(file)
      const mime = {
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.json': 'application/json',
        '.css': 'text/css',
        '.wasm': 'application/wasm'
      }
      res
        .writeHead(200, {
          'content-type': mime[extname(file)] ?? 'application/octet-stream',
          'cache-control': 'no-store'
        })
        .end(bytes)
    } catch {
      res.writeHead(404).end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = 'http://127.0.0.1:' + server.address().port
  browser = await chromium.launch()
  for (let round = 0; round < rounds; round++)
    for (let j = 0; j < modes.length; j++) {
      const mode = modes[(round + j) % modes.length],
        context = await browser.newContext(),
        page = await context.newPage()
      await page.goto(url + '/bench/')
      const init = await page.evaluate((m) => window.initialize(m), mode)
      const offset = round % queries.length
      const inputs = queries.slice(offset).concat(queries.slice(0, offset))
      const trials = []
      for (const input of inputs) trials.push(await page.evaluate((q) => window.trial(q), input))
      const cached = await page.evaluate((q) => window.trial(q), inputs.at(-1))
      const session = await context.newCDPSession(page)
      const memory = await heapBytes(session, mode !== 'main')
      if (round === 0) {
        for (const q of queries) {
          const { groups } = await page.evaluate((q) => window.allResults(q), q)
          const digest = createHash('sha256').update(JSON.stringify(groups)).digest('hex')
          if (mode === 'main') {
            reference.set(q, digest)
            previews.set(
              q,
              groups.flatMap((g) =>
                g.results
                  .slice(0, 4)
                  .map((r) =>
                    [
                      r.kind,
                      r.kind === 'lesson' ? r.date : (r.groupId ?? r.seriesId),
                      r.kind === 'lesson' ? r.anchor : ''
                    ].join('/')
                  )
              )
            )
          } else assert.equal(digest, reference.get(q), 'full ranked results for ' + q)
        }
      }
      samples[mode].push({ init, first: trials.shift(), trials, cached, memory })
      await context.close()
    }
  const production = await realPage(browser, url + '/app/', queries, previews)
  const js = await readFile(join(bench, 'ts.js')),
    wasmJs = await readFile(join(bench, 'wasm.js')),
    wasm = await readFile(join(bench, 'ranking.wasm'))
  const summary = {}
  for (const mode of modes) {
    const runs = samples[mode],
      warm = runs.flatMap((r) => r.trials)
    summary[mode] = {
      initMs: stats(runs.map((r) => r.init.load)),
      firstComputeMs: stats(runs.map((r) => r.first.compute)),
      firstFrameMs: stats(runs.map((r) => r.first.frame)),
      computeMs: stats(warm.map((t) => t.compute)),
      inputDomMs: stats(warm.map((t) => t.dom)),
      mainTaskDelayMs: stats(warm.map((t) => t.mainTask)),
      inputFrameMs: stats(warm.map((t) => t.frame)),
      cacheComputeMs: stats(runs.map((r) => r.cached.compute)),
      cacheFrameMs: stats(runs.map((r) => r.cached.frame)),
      jsHeapBytes: stats(runs.map((r) => r.memory)),
      linearBytes: runs[0].init.wasmBytes,
      engineGzipBytes: mode === 'wasm' ? gzipSync(wasmJs).length + gzipSync(wasm).length : gzipSync(js).length
    }
  }
  console.log(
    JSON.stringify(
      {
        commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        chromium: browser.version(),
        node: process.version,
        rounds,
        queries,
        lessons: packed.lessons.length,
        chunks: packed.lessons.reduce((n, r) => n + r[3].length, 0),
        strings: packed.strings.length,
        indexBytes: payload.length,
        indexGzipBytes: gzipSync(payload).length,
        parity: reference.size,
        summary,
        production
      },
      null,
      2
    )
  )
} finally {
  await browser?.close()
  if (server) await new Promise((resolve) => server.close(resolve))
  await rm(work, { recursive: true, force: true })
}

async function heapBytes(session, includeWorker) {
  await session.send('HeapProfiler.collectGarbage')
  let { usedSize } = await session.send('Runtime.getHeapUsage')
  if (!includeWorker) return usedSize
  const { targetInfos } = await session.send('Target.getTargets')
  const worker = targetInfos.find((t) => t.type === 'worker' && t.url.includes('/bench/'))
  assert(worker, 'dedicated search worker')
  const { sessionId } = await session.send('Target.attachToTarget', { targetId: worker.targetId, flatten: false })
  async function command(id, method) {
    const received = new Promise((resolve) => {
      function listener(e) {
        const m = JSON.parse(e.message)
        if (e.sessionId === sessionId && m.id === id) {
          session.off('Target.receivedMessageFromTarget', listener)
          resolve(m)
        }
      }
      session.on('Target.receivedMessageFromTarget', listener)
    })
    await session.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id, method }) })
    const reply = await received
    if (reply.error) throw Error(JSON.stringify(reply.error))
    return reply.result
  }
  await command(1, 'HeapProfiler.collectGarbage')
  usedSize += (await command(2, 'Runtime.getHeapUsage')).usedSize
  return usedSize
}

async function realPage(browser, url, inputs, previews) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto(url)
  const box = page.getByRole('textbox', { name: '全站搜索' })
  await box.fill('ない')
  await page.locator('.project-search-group [data-search-kind="lesson"]').first().waitFor()
  const timings = []
  for (const q of inputs.filter((x) => x !== 'ない')) {
    // Observe the actual React popup after a controlled input event and two frames.
    const ms = await box.evaluate(
      async (el, { q, expected }) => {
        const start = performance.now()
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, q)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        const delivered = () =>
          Array.from(document.querySelectorAll('.daily-search-result'), (e) =>
            [e.dataset.searchKind, e.dataset.searchTarget, e.dataset.searchAnchor ?? ''].join('/')
          )
        while (JSON.stringify(delivered()) !== JSON.stringify(expected)) {
          if (performance.now() - start > 5000)
            throw Error('Unexpected preview for ' + q + ': ' + JSON.stringify(delivered()))
          await new Promise(requestAnimationFrame)
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        return performance.now() - start
      },
      { q, expected: previews.get(q) }
    )
    timings.push(ms)
  }
  await context.close()
  return { mobileViewport: '390x844', warmInputFrameMs: stats(timings) }
}
