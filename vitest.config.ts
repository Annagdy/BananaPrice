import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    // O Vite não lê os "paths" do tsconfig: sem isso o "@/..." não resolve.
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/tests/unit/**/*.test.{ts,tsx}'],
    // Evita que o Vitest tente rodar os testes do Playwright
    exclude: ['node_modules', 'src/tests/e2e/**', 'e2e/**'],
  },
})