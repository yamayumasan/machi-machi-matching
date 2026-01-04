/**
 * テストデータをログイン中のユーザーに紐付けるスクリプト
 *
 * 使い方:
 *   pnpm --filter @machi/api tsx ../../prisma/link-test-data.ts <your-email>
 *
 * 例:
 *   pnpm --filter @machi/api tsx ../../prisma/link-test-data.ts your@email.com
 *
 * これにより、test_user_0のデータ（グループ、募集、通知など）が
 * 指定したemailのユーザーに紐付けられます。
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const targetEmail = process.argv[2]

  if (!targetEmail) {
    console.error('❌ メールアドレスを指定してください')
    console.log('使い方: pnpm --filter @machi/api tsx ../../prisma/link-test-data.ts <your-email>')
    process.exit(1)
  }

  console.log(`🔗 テストデータを ${targetEmail} に紐付けます...`)

  // ターゲットユーザーを取得
  const targetUser = await prisma.user.findUnique({
    where: { email: targetEmail },
  })

  if (!targetUser) {
    console.error(`❌ ユーザー ${targetEmail} が見つかりません`)
    console.log('先にログインしてユーザーを作成してください')
    process.exit(1)
  }

  // test_user_0のデータを取得
  const testUser = await prisma.user.findFirst({
    where: { email: 'test_user_0@example.com' },
  })

  if (!testUser) {
    console.error('❌ テストユーザー test_user_0@example.com が見つかりません')
    console.log('先に pnpm --filter @machi/api prisma:seed を実行してください')
    process.exit(1)
  }

  console.log(`📋 テストユーザー: ${testUser.nickname} (${testUser.email})`)
  console.log(`📋 ターゲットユーザー: ${targetUser.nickname || targetEmail}`)

  // グループメンバーシップを追加
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId: testUser.id },
    include: { group: true },
  })

  for (const membership of groupMemberships) {
    // 既に参加しているかチェック
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: membership.groupId,
          userId: targetUser.id,
        },
      },
    })

    if (!existing) {
      await prisma.groupMember.create({
        data: {
          groupId: membership.groupId,
          userId: targetUser.id,
          role: membership.role,
          lastReadAt: new Date(),
        },
      })
      console.log(`  ✅ グループ「${membership.group.name}」に参加`)
    } else {
      console.log(`  ⏭️ グループ「${membership.group.name}」は既に参加済み`)
    }
  }

  // 通知をコピー
  const notifications = await prisma.notification.findMany({
    where: { userId: testUser.id },
    take: 10,
  })

  for (const notification of notifications) {
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        isRead: false,
        createdAt: notification.createdAt,
      },
    })
  }
  console.log(`  ✅ ${notifications.length}件の通知を作成`)

  // 募集を1件作成（ターゲットユーザーがオーナーになる）
  const sampleRecruitment = await prisma.recruitment.findFirst({
    where: { creatorId: testUser.id },
  })

  if (sampleRecruitment) {
    const newRecruitment = await prisma.recruitment.create({
      data: {
        creatorId: targetUser.id,
        categoryId: sampleRecruitment.categoryId,
        title: `【テスト】${sampleRecruitment.title}`,
        description: sampleRecruitment.description,
        datetime: sampleRecruitment.datetime,
        datetimeFlex: sampleRecruitment.datetimeFlex,
        area: sampleRecruitment.area,
        location: sampleRecruitment.location,
        latitude: sampleRecruitment.latitude,
        longitude: sampleRecruitment.longitude,
        locationName: sampleRecruitment.locationName,
        minPeople: sampleRecruitment.minPeople,
        maxPeople: sampleRecruitment.maxPeople,
        status: sampleRecruitment.status,
      },
    })

    // この募集にグループを作成
    const group = await prisma.group.create({
      data: {
        recruitmentId: newRecruitment.id,
        name: newRecruitment.title,
      },
    })

    // オーナーとしてメンバー追加
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: targetUser.id,
        role: 'OWNER',
        lastReadAt: new Date(),
      },
    })

    // テストユーザーをメンバーとして追加
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: testUser.id,
        role: 'MEMBER',
        lastReadAt: new Date(),
      },
    })

    // サンプルメッセージを追加
    const messages = [
      { senderId: targetUser.id, content: 'グループを作成しました！よろしくお願いします！' },
      { senderId: testUser.id, content: '参加できてうれしいです！楽しみにしています！' },
      { senderId: targetUser.id, content: '日程は来週末でどうでしょうか？' },
      { senderId: testUser.id, content: '了解です！13時集合でいかがでしょうか' },
      { senderId: targetUser.id, content: 'いいですね！場所は仙台駅周辺で' },
    ]

    const baseDate = new Date()
    baseDate.setHours(baseDate.getHours() - 2)

    for (let i = 0; i < messages.length; i++) {
      const msgDate = new Date(baseDate)
      msgDate.setMinutes(msgDate.getMinutes() + i * 5)
      await prisma.message.create({
        data: {
          groupId: group.id,
          senderId: messages[i].senderId,
          content: messages[i].content,
          createdAt: msgDate,
        },
      })
    }

    console.log(`  ✅ 自分がオーナーの募集「${newRecruitment.title}」とグループを作成`)
  }

  console.log('')
  console.log('✅ テストデータの紐付けが完了しました！')
  console.log('')
  console.log('これで以下の機能がテストできます:')
  console.log('  - グループ一覧ページ (/groups)')
  console.log('  - グループチャットページ (/groups/:id)')
  console.log('  - 通知ページ (/notifications)')
  console.log('  - 通知ベル（未読バッジ）')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
