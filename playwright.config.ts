import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
export default defineConfig({
  outputDir: join(tmpdir(), 'n1-improvements-playwright'),
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 }, contextOptions: { reducedMotion: 'reduce' } },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
})
