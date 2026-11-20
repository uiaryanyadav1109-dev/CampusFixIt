// Auth.js config — full OAuth configuration implemented in T-005
// Provides typed auth() helper for API routes and server components
import type { SessionUser } from '@/lib/permissions'

export const authConfig = {}

export async function auth(): Promise<{ user?: SessionUser } | null> {
  return null
}
