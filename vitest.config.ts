import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/helpers/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/server/**', 'src/lib/**'],
      thresholds: {
        // 100% branch coverage required on these critical files (TESTING.md)
        // enforced per-file in individual test suites
      },
    },
  },
})
