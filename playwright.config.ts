import { availableParallelism, tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
const port = Number(process.env.N1_PREVIEW_PORT || 4173)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid N1_PREVIEW_PORT')
const previewUrl = `http://127.0.0.1:${port}`
const hosted = process.env.GITHUB_ACTIONS === 'true'
const audioWorker = !hosted && process.env.N1_AUDIO_WORKER_E2E === '1'
export default defineConfig({
  outputDir: process.env.N1_TEST_OUTPUT_DIR || join(tmpdir(), 'n1-improvements-playwright'),
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: true,
  // The unattended audio worker shares the Mac with other daily tasks. Avoid
  // CPU-count-based fan-out starving short recordings and cumulative UI flows.
  // Hosted CI may use up to four CPUs; Pages shards explicitly use two each.
  // The local Mac worker remains capped at two regardless of local CI flags.
  workers: hosted ? Math.max(1, Math.min(4, availableParallelism())) : 2,
  // Background macOS scheduling can delay loading an archived lesson and
  // rendering its route. Allow more time for the same assertions.
  ...(audioWorker ? { timeout: 90_000, expect: { timeout: 15_000 } } : {}),
  use: {
    baseURL: previewUrl,
    viewport: { width: 1440, height: 1000 },
    contextOptions: { reducedMotion: 'reduce' },
    ...(hosted || audioWorker ? { screenshot: 'only-on-failure' as const } : {}),
    // Preserve failed actions and their call logs without capturing a
    // screenshot stream and DOM snapshots throughout every passing test.
    ...(audioWorker ? { trace: { mode: 'retain-on-failure' as const, screenshots: false, snapshots: false } } : {}),
  },
  webServer: { command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`, url: previewUrl, reuseExistingServer: false },
})
