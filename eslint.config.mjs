import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'prisma/migrations/**',
    'tests/**', // linted separately via vitest
  ]),
  {
    rules: {
      // Disallow any without a comment — matches AGENTS.md code style
      '@typescript-eslint/no-explicit-any': 'warn',
      // Prefer early returns and clear names
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // No dangerouslySetInnerHTML with user content (enforced at lint level)
      'react/no-danger': 'error',
    },
  },
])

export default eslintConfig
