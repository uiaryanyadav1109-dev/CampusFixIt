/**
 * src/lib/permissions.ts
 *
 * THE ONLY place where roles are checked.
 * Every endpoint and service uses can() — never write if(user.role === ...) elsewhere.
 */

export type Role = 'REPORTER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN'

export type SessionUser = {
  id: string
  name: string | null
  email: string
  role: Role
  departmentId: string | null
  isActive: boolean
}

/**
 * Actions that map to the permission matrix in docs/PRD.md.
 */
export type Action =
  | 'report:create'
  | 'report:view_own'
  | 'report:view_all' // scope checked via resource
  | 'report:verify'
  | 'report:reject'
  | 'report:prioritise'
  | 'report:assign'
  | 'report:status_update' // scope checked via resource
  | 'report:upload_after' // scope checked via resource
  | 'report:reopen' // scope checked via resource
  | 'report:comment' // scope checked via resource
  | 'master_data:manage'
  | 'analytics:view' // scope checked via resource
  | 'user:manage'
  | 'user:view'

/**
 * Resource context for scope-aware checks.
 * Pass the relevant IDs from the resource being accessed.
 */
export type Resource = {
  reporterId?: string | null
  assigneeId?: string | null
  departmentId?: string | null
}

/**
 * can(user, action, resource?) → boolean
 *
 * Returns true if the user is allowed to perform action on resource.
 * When a resource is required for scope checks (e.g. report:view_own) and
 * is not provided, returns false.
 */
export function can(user: SessionUser, action: Action, resource?: Resource): boolean {
  // Inactive users can do nothing
  if (!user.isActive) return false

  const { role, id: userId, departmentId } = user

  switch (action) {
    // ------------------------------------------------------------------ create
    case 'report:create':
      return true // any signed-in user

    // ------------------------------------------------------------------ view own
    case 'report:view_own':
      return true // any signed-in user (scope enforced in query)

    // ------------------------------------------------------------------ view all
    case 'report:view_all':
      if (role === 'SUPER_ADMIN') return true
      if (role === 'ADMIN') {
        // ADMIN may view all reports in their own department
        if (!resource?.departmentId || !departmentId) return false
        return resource.departmentId === departmentId
      }
      if (role === 'STAFF') {
        // STAFF may view only assigned reports
        if (!resource?.assigneeId) return false
        return resource.assigneeId === userId
      }
      return false

    // ------------------------------------------------------------------ verify / reject / prioritise
    case 'report:verify':
    case 'report:reject':
    case 'report:prioritise':
      if (role === 'SUPER_ADMIN') return true
      if (role === 'ADMIN') {
        if (!resource?.departmentId || !departmentId) return false
        return resource.departmentId === departmentId
      }
      return false

    // ------------------------------------------------------------------ assign
    case 'report:assign':
      if (role === 'SUPER_ADMIN') return true
      if (role === 'ADMIN') {
        if (!resource?.departmentId || !departmentId) return false
        return resource.departmentId === departmentId
      }
      return false

    // ------------------------------------------------------------------ status update / upload after
    case 'report:status_update':
    case 'report:upload_after':
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true
      if (role === 'STAFF') {
        // Only the assigned staff member
        if (!resource?.assigneeId) return false
        return resource.assigneeId === userId
      }
      return false

    // ------------------------------------------------------------------ reopen
    case 'report:reopen':
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true
      if (role === 'REPORTER' || role === 'STAFF') {
        // Reporter may reopen only their own report; STAFF may not reopen
        if (role === 'STAFF') return false
        if (!resource?.reporterId) return false
        return resource.reporterId === userId
      }
      return false

    // ------------------------------------------------------------------ comment
    case 'report:comment':
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true
      if (role === 'STAFF') {
        if (!resource?.assigneeId) return false
        return resource.assigneeId === userId
      }
      if (role === 'REPORTER') {
        if (!resource?.reporterId) return false
        return resource.reporterId === userId
      }
      return false

    // ------------------------------------------------------------------ master data
    case 'master_data:manage':
      return role === 'SUPER_ADMIN'

    // ------------------------------------------------------------------ analytics
    case 'analytics:view':
      if (role === 'SUPER_ADMIN') return true
      if (role === 'ADMIN') return true // scoped by dept in query
      return false

    // ------------------------------------------------------------------ user manage
    case 'user:manage':
      return role === 'SUPER_ADMIN'

    // ------------------------------------------------------------------ user view (list)
    case 'user:view':
      return role === 'ADMIN' || role === 'SUPER_ADMIN'

    default:
      return false
  }
}
