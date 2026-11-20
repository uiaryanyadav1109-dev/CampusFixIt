/**
 * prisma/seed.ts — idempotent seed for CampusFixIt.
 *
 * Run with:  npm run db:seed
 *            (or automatically after `prisma migrate reset`)
 *
 * What it creates:
 *   - 3 departments
 *   - 8 categories (each linked to a department)
 *   - 10 sample locations
 *   - 1 SUPER_ADMIN user (email from SEED_SUPER_ADMIN_EMAIL env)
 *
 * Uses upsert on every record so it is safe to run multiple times.
 */

import { PrismaClient, type Priority } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------------

const DEPARTMENTS = [
  { name: 'Electrical & Maintenance' },
  { name: 'Civil & Infrastructure' },
  { name: 'IT & Network Services' },
] as const

const CATEGORIES: {
  name: string
  defaultPriority: Priority
  departmentName: string
}[] = [
  { name: 'Electrical',      defaultPriority: 'HIGH',   departmentName: 'Electrical & Maintenance' },
  { name: 'Plumbing',        defaultPriority: 'HIGH',   departmentName: 'Civil & Infrastructure' },
  { name: 'Furniture',       defaultPriority: 'NORMAL', departmentName: 'Civil & Infrastructure' },
  { name: 'Civil',           defaultPriority: 'NORMAL', departmentName: 'Civil & Infrastructure' },
  { name: 'Lab Equipment',   defaultPriority: 'HIGH',   departmentName: 'Electrical & Maintenance' },
  { name: 'IT and Network',  defaultPriority: 'NORMAL', departmentName: 'IT & Network Services' },
  { name: 'Sanitation',      defaultPriority: 'HIGH',   departmentName: 'Civil & Infrastructure' },
  { name: 'Other',           defaultPriority: 'NORMAL', departmentName: 'Civil & Infrastructure' },
]

const LOCATIONS: { building: string; floor: string; room: string }[] = [
  { building: 'Academic Block A', floor: 'Ground Floor', room: 'A-101' },
  { building: 'Academic Block A', floor: 'Ground Floor', room: 'A-102' },
  { building: 'Academic Block A', floor: 'First Floor',  room: 'A-201' },
  { building: 'Academic Block B', floor: 'Ground Floor', room: 'B-101' },
  { building: 'Academic Block B', floor: 'First Floor',  room: 'B-201' },
  { building: 'Library',          floor: 'Ground Floor', room: 'Reading Hall' },
  { building: 'Library',          floor: 'First Floor',  room: 'Computer Lab' },
  { building: 'Hostel Block 1',   floor: 'Ground Floor', room: 'Common Room' },
  { building: 'Hostel Block 1',   floor: 'First Floor',  room: 'H1-101' },
  { building: 'Admin Block',      floor: 'Ground Floor', room: 'Reception' },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('🌱  Starting seed...')

  // 1. Departments
  console.log('  → Upserting departments...')
  const departmentMap = new Map<string, string>() // name → id

  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where:  { name: dept.name },
      update: {},
      create: { name: dept.name },
    })
    departmentMap.set(record.name, record.id)
  }

  // 2. Categories
  console.log('  → Upserting categories...')
  for (const cat of CATEGORIES) {
    const deptId = departmentMap.get(cat.departmentName)
    if (!deptId) {
      throw new Error(`Department not found for category "${cat.name}": "${cat.departmentName}"`)
    }
    await prisma.category.upsert({
      where:  { name: cat.name },
      update: { defaultPriority: cat.defaultPriority, defaultDepartmentId: deptId },
      create: {
        name:                cat.name,
        defaultPriority:     cat.defaultPriority,
        defaultDepartmentId: deptId,
      },
    })
  }

  // 3. Locations
  console.log('  → Upserting locations...')
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where:  { building_floor_room: { building: loc.building, floor: loc.floor, room: loc.room } },
      update: {},
      create: { building: loc.building, floor: loc.floor, room: loc.room },
    })
  }

  // 4. SUPER_ADMIN user
  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL
  if (!adminEmail) {
    console.warn(
      '  ⚠  SEED_SUPER_ADMIN_EMAIL is not set — skipping super admin user creation.',
    )
  } else {
    console.log(`  → Upserting SUPER_ADMIN: ${adminEmail}`)
    await prisma.user.upsert({
      where:  { email: adminEmail },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        email: adminEmail,
        name:  'Super Admin',
        role:  'SUPER_ADMIN',
      },
    })
  }

  console.log('✅  Seed complete.')
}

main()
  .catch((err: unknown) => {
    console.error('❌  Seed failed:', err)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
