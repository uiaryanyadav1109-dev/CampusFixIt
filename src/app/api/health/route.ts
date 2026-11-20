import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Returns 200 with status, version and timestamp.
 * Used by uptime monitors and the Phase 1 gate check.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      version: '0.1.0',
      ts: new Date().toISOString(),
    },
    { status: 200 }
  )
}
