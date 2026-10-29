import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync } from 'node:fs'
import { validateAudio } from './scripts/validate-audio.ts'
import { audioSources } from './src/lib/audioSources.ts'
import { browserDataPlugin } from './scripts/browser-data-plugin.ts'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react(), browserDataPlugin(), { name: 'validate-lesson-content', buildStart() { validateAudio() } }, {
    name: 'omit-published-audio-cache',
    closeBundle() { if (audioSources.complete) rmSync(new URL('./dist/audio/morioki-normal/', import.meta.url), { recursive: true, force: true }) },
  }],
}))
