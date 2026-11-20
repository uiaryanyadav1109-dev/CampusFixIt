import { z } from 'zod'

export const ReportStatusEnum = z.enum([
  'SUBMITTED',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
])
export type ReportStatus = z.infer<typeof ReportStatusEnum>

export const PriorityEnum = z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW'])
export type Priority = z.infer<typeof PriorityEnum>

export const RoleEnum = z.enum(['REPORTER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'])
export type Role = z.infer<typeof RoleEnum>

export const MediaKindEnum = z.enum(['BEFORE', 'AFTER'])
export type MediaKind = z.infer<typeof MediaKindEnum>
