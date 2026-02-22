/**
 * ユーザーの状態を確認するスクリプト
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TARGET_EMAIL = 'gedozu@appmail.uk'

async function main() {
  console.log('🔍 ユーザー状態チェック')
  console.log(`📧 対象: ${TARGET_EMAIL}`)
  console.log('')

  const user = await prisma.user.findFirst({
    where: { email: TARGET_EMAIL },
    include: {
      interests: {
        include: { category: true },
      },
    },
  })

  if (!user) {
    console.log('❌ ユーザーが見つかりません')
    return
  }

  console.log('📦 ユーザー情報:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Nickname: ${user.nickname}`)
  console.log(`   Area: ${user.area}`)
  console.log(`   isOnboarded: ${user.isOnboarded}`)
  console.log(`   CreatedAt: ${user.createdAt}`)
  console.log(`   UpdatedAt: ${user.updatedAt}`)
  console.log('')
  console.log(`   興味カテゴリ: ${user.interests.length}件`)
  if (user.interests.length > 0) {
    user.interests.forEach((i) => {
      console.log(`     - ${i.category.name}`)
    })
  }

  if (!user.isOnboarded) {
    console.log('')
    console.log('⚠️ isOnboarded が false です！')
    console.log('   ログイン後にオンボーディング画面が表示される原因です。')
    console.log('')
    console.log('🔧 修正コマンド:')
    console.log(`   npx ts-node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { email: '${TARGET_EMAIL}' }, data: { isOnboarded: true } }).then(console.log)"`)
  }

  // 関連データの確認
  console.log('')
  console.log('📊 関連データ:')

  const recruitments = await prisma.recruitment.count({ where: { creatorId: user.id } })
  const wantToDos = await prisma.wantToDo.count({ where: { userId: user.id } })
  const groupMembers = await prisma.groupMember.count({ where: { userId: user.id } })
  const notifications = await prisma.notification.count({ where: { userId: user.id } })

  console.log(`   募集: ${recruitments}件`)
  console.log(`   やりたいこと: ${wantToDos}件`)
  console.log(`   参加グループ: ${groupMembers}件`)
  console.log(`   通知: ${notifications}件`)
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
