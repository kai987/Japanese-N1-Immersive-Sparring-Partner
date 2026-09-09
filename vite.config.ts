import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { validateContent } from './scripts/validate-content.ts'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react(), { name: 'validate-lesson-content', buildStart() { validateContent() } }],
}))
