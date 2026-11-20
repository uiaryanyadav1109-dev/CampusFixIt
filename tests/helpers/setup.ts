/**
 * tests/helpers/setup.ts
 * Global test setup. External services (storage, email, SSO) are mocked here.
 */
import { vi } from 'vitest'

// Mock next-auth — prevents real OAuth calls in unit/api tests
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
  default: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authConfig: {},
}))

// Mock Resend email client
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
}))

// Mock storage client
vi.mock('@/lib/storage', () => ({
  getSignedUploadUrl: vi.fn().mockResolvedValue('https://mock-storage.example.com/upload'),
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://mock-storage.example.com/file'),
  objectExists: vi.fn().mockResolvedValue(true),
}))
