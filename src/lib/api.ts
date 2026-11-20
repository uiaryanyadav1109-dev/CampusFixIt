/**
 * src/lib/api.ts
 *
 * withAuth()       — authenticates the request; returns 401 if not signed in
 * apiError()       — standard JSON error shape from API_SPEC.md
 * apiSuccess()     — 200 JSON response
 * apiCreated()     — 201 JSON response
 * paginationParams() — parse ?page=&pageSize= safely
 */

import { auth } from '@/lib/auth'
import type { SessionUser } from '@/lib/permissions'
import { ZodError } from 'zod'

// ------------------------------------------------------------------ types

export type PaginationParams = {
  page: number
  pageSize: number
  skip: number
}

type ErrorDetail = { path: string; message: string }

// ------------------------------------------------------------------ error helpers

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ErrorDetail[]
): Response {
  const body: { error: { code: string; message: string; details?: ErrorDetail[] } } = {
    error: { code, message },
  }
  if (details?.length) body.error.details = details
  return Response.json(body, { status })
}

export const Errors = {
  unauthenticated: () => apiError(401, 'UNAUTHENTICATED', 'Sign in required'),
  forbidden: () => apiError(403, 'FORBIDDEN', 'You do not have permission for this action'),
  notFound: (entity = 'Resource') => apiError(404, 'NOT_FOUND', `${entity} not found`),
  invalidTransition: (msg = 'This status change is not allowed') =>
    apiError(409, 'INVALID_TRANSITION', msg),
  conflict: (msg: string) => apiError(409, 'CONFLICT', msg),
  fileTooLarge: () => apiError(413, 'FILE_TOO_LARGE', 'File exceeds the 5 MB limit'),
  unsupportedMediaType: () =>
    apiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG and WebP files are accepted'),
  rateLimited: () => apiError(429, 'RATE_LIMITED', 'Too many requests. Please slow down.'),
  internal: () => apiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.'),
  validation: (details: ErrorDetail[]) =>
    apiError(400, 'VALIDATION_ERROR', 'Validation failed', details),
}

// ------------------------------------------------------------------ success helpers

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

export function apiCreated<T>(data: T): Response {
  return Response.json(data, { status: 201 })
}

// ------------------------------------------------------------------ pagination

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 25

export function paginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
    )
  )
  return { page, pageSize, skip: (page - 1) * pageSize }
}

// ------------------------------------------------------------------ withAuth

/**
 * Wraps a route handler with authentication.
 * Calls handler(user) if authenticated; returns 401 otherwise.
 * Also blocks inactive users (belt-and-suspenders beyond the cookie check).
 */
export async function withAuth(
  handler: (user: SessionUser) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth()
    if (!session?.user) {
      return Errors.unauthenticated()
    }
    const user = session.user as SessionUser
    if (!user.isActive) {
      return Errors.unauthenticated()
    }
    return await handler(user)
  } catch (err) {
    console.error('[withAuth] unexpected error', err)
    return Errors.internal()
  }
}

// ------------------------------------------------------------------ Zod validation helper

export function fromZodError(err: ZodError): Response {
  const details = err.issues.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }))
  return Errors.validation(details)
}
