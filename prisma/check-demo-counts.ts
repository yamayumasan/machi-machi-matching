import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const totalUsers = await prisma.user.count()
  console.log('OK: total users =', totalUsers)

  const u = await prisma.user.findUnique({
    where: { email: 'gedozu@appmail.uk' },
  })

  if (!u) {
    console.log('demo user: NOT FOUND')
    return
  }

  const recruitments = await prisma.recruitment.count({ where: { userId: u.id } })
  const groupMemberships = await prisma.groupMember.count({ where: { userId: u.id } })
  const messages = await prisma.message.count({ where: { senderId: u.id } })

  console.log({
    userId: u.id,
    email: u.email,
    nickname: u.nickname,
    recruitments,
    groupMemberships,
    messages,
  })
}

main()
  .catch((e) => {
    console.error('FAIL:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
