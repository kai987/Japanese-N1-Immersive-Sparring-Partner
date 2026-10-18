import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { validateContent } from './scripts/validate-content.ts'
import { rmSync } from 'node:fs'
import { validateAudio } from './scripts/validate-audio.ts'
import { audioSources } from './src/lib/audioSources.ts'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react(), { name: 'validate-lesson-content', buildStart() { validateContent(); validateAudio() } }, {
    name: 'omit-published-audio-cache',
    closeBundle() { if (audioSources.complete) rmSync(new URL('./dist/audio/morioki-normal/', import.meta.url), { recursive: true, force: true }) },
  }],
}))
