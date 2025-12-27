import { PrismaClient } from '@prisma/client'
import { CATEGORIES } from '@machi/shared'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // カテゴリの作成
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i]
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        icon: category.icon,
        sortOrder: i,
      },
      create: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        sortOrder: i,
      },
    })
  }

  console.log(`✅ Created ${CATEGORIES.length} categories`)
  console.log('🌱 Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
