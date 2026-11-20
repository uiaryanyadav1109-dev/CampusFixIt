import { z } from 'zod'

/**
 * Validates all required environment variables at startup.
 * Throws immediately if any required var is missing.
 * Import this module in src/lib/db.ts, src/lib/auth.ts etc. — never read
 * process.env directly outside this file.
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_TEST: z.string().optional(),

  // Auth.js
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string().optional(),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string().optional(),
  AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: z.string().default('common'),

  // Domain restriction
  ALLOWED_EMAIL_DOMAIN: z.string().min(1, 'ALLOWED_EMAIL_DOMAIN is required'),

  // Object storage
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_REGION: z.string().default('auto'),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().optional(),

  // App
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Seed
  SEED_SUPER_ADMIN_EMAIL: z.string().email().optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),

  // Test auth bypass — MUST be false/absent in production
  AUTH_TEST_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true')
    .pipe(z.boolean()),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Validate at import time — fail fast with a clear error message
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`\n❌ Missing or invalid environment variables:\n${missing}\n`)
}

// Guard: AUTH_TEST_MODE must never be true in production
if (parsed.data.AUTH_TEST_MODE && parsed.data.NODE_ENV === 'production') {
  throw new Error('AUTH_TEST_MODE must not be enabled in production')
}

export const env = parsed.data
export type Env = typeof env
