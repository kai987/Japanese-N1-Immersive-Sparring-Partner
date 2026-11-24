import { availableParallelism, tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
const port = Number(process.env.N1_PREVIEW_PORT || 4173)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid N1_PREVIEW_PORT')
const previewUrl = `http://127.0.0.1:${port}`
export default defineConfig({
  outputDir: process.env.N1_TEST_OUTPUT_DIR || join(tmpdir(), 'n1-improvements-playwright'),
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: true,
  // The unattended audio worker shares the Mac with other daily tasks. Avoid
  // CPU-count-based fan-out starving short recordings and cumulative UI flows.
  // Hosted CI may use up to four CPUs; Pages shards explicitly use two each.
  // The local Mac worker remains capped at two regardless of local CI flags.
  workers: process.env.GITHUB_ACTIONS === 'true' ? Math.max(1, Math.min(4, availableParallelism())) : 2,
  use: { baseURL: previewUrl, viewport: { width: 1440, height: 1000 }, contextOptions: { reducedMotion: 'reduce' }, ...(process.env.GITHUB_ACTIONS === 'true' ? { screenshot: 'only-on-failure' as const } : {}) },
  webServer: { command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`, url: previewUrl, reuseExistingServer: false },
})
