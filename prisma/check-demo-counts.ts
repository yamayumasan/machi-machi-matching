import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ColumnRow {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
}

async function main() {
  const cols = await prisma.$queryRaw<ColumnRow[]>`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `

  const grouped: Record<string, string[]> = {}
  for (const c of cols) {
    if (!grouped[c.table_name]) grouped[c.table_name] = []
    grouped[c.table_name].push(c.column_name)
  }

  console.log('=== Production DB schema (public) ===')
  for (const [table, columns] of Object.entries(grouped)) {
    console.log(`\n[${table}]`)
    console.log('  ' + columns.join(', '))
  }

  console.log('\n=== Demo user lookup (raw SQL, avoiding lastActiveAt) ===')
  const rows = await prisma.$queryRaw<{ id: string; email: string; nickname: string | null }[]>`
    SELECT id, email, nickname FROM "User" WHERE email = 'gedozu@appmail.uk'
  `
  if (rows.length === 0) {
    console.log('demo user: NOT FOUND')
    return
  }
  const u = rows[0]
  console.log('demo user:', u)

  const [{ count: recCount }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM "Recruitment" WHERE "userId" = ${u.id}
  `
  const [{ count: grpCount }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM "GroupMember" WHERE "userId" = ${u.id}
  `
  const [{ count: msgCount }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM "Message" WHERE "senderId" = ${u.id}
  `

  console.log('demo user content counts:', {
    recruitments: Number(recCount),
    groupMemberships: Number(grpCount),
    messages: Number(msgCount),
  })
}

main()
  .catch((e) => {
    console.error('FAIL:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
