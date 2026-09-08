import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Japanese-N1-Immersive-Sparring-Partner/' : '/',
  plugins: [react()],
}))
