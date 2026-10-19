import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
const port = Number(process.env.N1_PREVIEW_PORT || 4173)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid N1_PREVIEW_PORT')
const previewUrl = `http://127.0.0.1:${port}`
export default defineConfig({
  outputDir: process.env.N1_TEST_OUTPUT_DIR || join(tmpdir(), 'n1-improvements-playwright'),
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: true,
  use: { baseURL: previewUrl, viewport: { width: 1440, height: 1000 }, contextOptions: { reducedMotion: 'reduce' } },
  webServer: { command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`, url: previewUrl, reuseExistingServer: false },
})
