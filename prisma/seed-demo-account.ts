/**
 * Apple審査用デモアカウントにデータを投入するスクリプト
 *
 * 使用方法:
 * 本番環境のDATABASE_URLを設定して実行:
 * DATABASE_URL="postgresql://..." npx ts-node prisma/seed-demo-account.ts
 *
 * または package.json にスクリプトを追加して実行
 */

import {
  PrismaClient,
  Area,
  Timing,
  RecruitmentStatus,
  ApplicationStatus,
  OfferStatus,
  NotificationType,
  GroupMemberRole,
} from '@prisma/client'

const prisma = new PrismaClient()

// デモアカウントのメールアドレス
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'gedozu@appmail.uk'

// 仙台エリアの主要スポット
const SENDAI_LOCATIONS = [
  { name: '仙台駅', lat: 38.2601, lng: 140.8821 },
  { name: '広瀬通駅', lat: 38.261, lng: 140.8736 },
  { name: '勾当台公園駅', lat: 38.2669, lng: 140.8704 },
  { name: '国分町', lat: 38.265, lng: 140.8698 },
  { name: '仙台アーケード', lat: 38.2621, lng: 140.8765 },
]

// ダミーユーザー名
const DUMMY_NICKNAMES = ['さくら', 'はると', 'ゆい', 'そうた', 'あおい']

// ランダムに配列から要素を取得
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 範囲内のランダム整数
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 位置を少しずらす
function jitterLocation(lat: number, lng: number): { lat: number; lng: number } {
  const jitter = 0.003
  return {
    lat: lat + (Math.random() - 0.5) * jitter * 2,
    lng: lng + (Math.random() - 0.5) * jitter * 2,
  }
}

// 将来の日時を生成
function futureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(randomInt(10, 18), 0, 0, 0)
  return date
}

// 過去の日時を生成
function pastDate(hoursAgo: number): Date {
  const date = new Date()
  date.setHours(date.getHours() - hoursAgo)
  return date
}

async function main() {
  console.log('🎯 Apple審査用デモデータ投入スクリプト')
  console.log(`📧 対象アカウント: ${DEMO_USER_EMAIL}`)
  console.log('')

  // デモユーザーを取得
  const demoUser = await prisma.user.findFirst({
    where: { email: DEMO_USER_EMAIL },
    include: {
      interests: true,
    },
  })

  if (!demoUser) {
    console.error(`❌ ユーザーが見つかりません: ${DEMO_USER_EMAIL}`)
    console.log('Supabase Authでユーザーを作成し、アプリでオンボーディングを完了してください')
    process.exit(1)
  }

  console.log(`✅ ユーザー確認: ${demoUser.nickname || demoUser.email} (${demoUser.id})`)
  console.log(`   エリア: ${demoUser.area}`)
  console.log(`   興味カテゴリ: ${demoUser.interests.length}件`)

  // 既存のデータ状況を確認
  const existingRecruitments = await prisma.recruitment.count({
    where: { creatorId: demoUser.id },
  })
  const existingWantToDos = await prisma.wantToDo.count({
    where: { userId: demoUser.id },
  })
  const existingGroups = await prisma.groupMember.count({
    where: { userId: demoUser.id },
  })

  console.log('')
  console.log('📊 既存データ状況:')
  console.log(`   募集: ${existingRecruitments}件`)
  console.log(`   やりたいこと: ${existingWantToDos}件`)
  console.log(`   参加グループ: ${existingGroups}件`)
  console.log('')

  // ダミーユーザーを作成（チャット相手用）
  console.log('👥 ダミーユーザーを作成中...')
  const dummyUsers: { id: string; nickname: string }[] = []

  for (let i = 0; i < DUMMY_NICKNAMES.length; i++) {
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const existingDummy = await prisma.user.findFirst({
      where: { email: `demo_dummy_${i}@example.com` },
    })

    if (existingDummy) {
      dummyUsers.push({ id: existingDummy.id, nickname: existingDummy.nickname || DUMMY_NICKNAMES[i] })
      continue
    }

    const dummy = await prisma.user.create({
      data: {
        email: `demo_dummy_${i}@example.com`,
        nickname: DUMMY_NICKNAMES[i],
        bio: '仙台で活動しています！',
        area: demoUser.area || Area.SENDAI,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        isOnboarded: true,
      },
    })
    dummyUsers.push({ id: dummy.id, nickname: dummy.nickname || DUMMY_NICKNAMES[i] })

    // カテゴリを設定
    const categoryIds = ['1', '2', '3', '4', '5'].slice(0, randomInt(2, 4))
    for (const categoryId of categoryIds) {
      await prisma.userCategory.create({
        data: { userId: dummy.id, categoryId },
      }).catch(() => {}) // 重複は無視
    }
  }
  console.log(`   ${dummyUsers.length}人のダミーユーザーを確認`)

  // === 募集を作成（デモユーザーが作成） ===
  console.log('')
  console.log('📝 募集を作成中...')

  const recruitmentData = [
    {
      categoryId: '1',
      title: '週末ボードゲーム会',
      description: '仙台駅周辺でボードゲームを楽しみましょう！初心者大歓迎です。カタンやドミニオンなど持っていきます。',
    },
    {
      categoryId: '2',
      title: 'カフェ巡り仲間募集',
      description: '仙台のおしゃれカフェを一緒に開拓しませんか？写真撮るのが好きな方も歓迎です！',
    },
    {
      categoryId: '4',
      title: 'フットサルメンバー募集',
      description: '毎週土曜日にフットサルをしています。経験不問、楽しく運動したい方お待ちしています。',
    },
  ]

  const createdRecruitments: { id: string; title: string }[] = []

  for (const data of recruitmentData) {
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const recruitment = await prisma.recruitment.create({
      data: {
        creatorId: demoUser.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        datetime: futureDate(randomInt(3, 10)),
        area: demoUser.area || Area.SENDAI,
        location: location.name,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        minPeople: 2,
        maxPeople: randomInt(4, 8),
        status: RecruitmentStatus.OPEN,
      },
    })
    createdRecruitments.push({ id: recruitment.id, title: recruitment.title })
    console.log(`   ✅ ${recruitment.title}`)
  }

  // === やりたいことを作成（デモユーザーが表明） ===
  console.log('')
  console.log('💭 やりたいことを作成中...')

  const wantToDoData = [
    { categoryId: '3', comment: '今週末、軽く飲みに行きたいな', timing: Timing.THIS_WEEK },
    { categoryId: '8', comment: 'ライブ行きたい！一緒に行ける人いませんか？', timing: Timing.THIS_MONTH },
  ]

  for (const data of wantToDoData) {
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.wantToDo.create({
      data: {
        userId: demoUser.id,
        categoryId: data.categoryId,
        timing: data.timing,
        comment: data.comment,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        expiresAt,
      },
    })
    console.log(`   ✅ ${data.comment}`)
  }

  // === ダミーユーザーの募集を作成（デモユーザーが参加できる募集） ===
  console.log('')
  console.log('📝 他ユーザーの募集を作成中...')

  const otherRecruitmentData = [
    {
      creatorIndex: 0,
      categoryId: '6',
      title: '話題の映画観に行きませんか',
      description: '週末に映画を観に行く仲間を募集しています！',
    },
    {
      creatorIndex: 1,
      categoryId: '9',
      title: '朝ラン仲間募集',
      description: '広瀬川沿いを一緒に走りましょう！ペースはゆっくりめです。',
    },
  ]

  const otherRecruitments: { id: string; creatorId: string; title: string }[] = []

  for (const data of otherRecruitmentData) {
    const creator = dummyUsers[data.creatorIndex]
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const recruitment = await prisma.recruitment.create({
      data: {
        creatorId: creator.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        datetime: futureDate(randomInt(5, 14)),
        area: demoUser.area || Area.SENDAI,
        location: location.name,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        minPeople: 2,
        maxPeople: randomInt(4, 6),
        status: RecruitmentStatus.OPEN,
      },
    })
    otherRecruitments.push({ id: recruitment.id, creatorId: creator.id, title: recruitment.title })
    console.log(`   ✅ ${recruitment.title} (by ${creator.nickname})`)
  }

  // === グループを作成（チャット機能確認用） ===
  console.log('')
  console.log('💬 グループとチャットを作成中...')

  // グループ1: デモユーザーがオーナー
  const group1Recruitment = createdRecruitments[0]
  const group1 = await prisma.group.create({
    data: {
      recruitmentId: group1Recruitment.id,
      name: group1Recruitment.title,
    },
  })

  // オーナーとして追加
  await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      userId: demoUser.id,
      role: GroupMemberRole.OWNER,
      lastReadAt: new Date(),
    },
  })

  // メンバーを追加
  for (let i = 0; i < 3; i++) {
    await prisma.groupMember.create({
      data: {
        groupId: group1.id,
        userId: dummyUsers[i].id,
        role: GroupMemberRole.MEMBER,
        lastReadAt: pastDate(randomInt(1, 5)),
      },
    })
  }

  // チャットメッセージを追加
  const group1Messages = [
    { senderId: demoUser.id, content: 'グループへようこそ！週末のボドゲ会、楽しみにしています。' },
    { senderId: dummyUsers[0].id, content: 'はじめまして！参加できてうれしいです！' },
    { senderId: dummyUsers[1].id, content: 'よろしくお願いします〜' },
    { senderId: dummyUsers[2].id, content: '初心者ですが大丈夫ですか？' },
    { senderId: demoUser.id, content: 'もちろんです！簡単なゲームから始めましょう。' },
    { senderId: dummyUsers[0].id, content: '土曜日の13時からでいかがですか？' },
    { senderId: dummyUsers[1].id, content: '了解です！' },
    { senderId: demoUser.id, content: 'OKです！仙台駅の東口に集合しましょう。' },
    { senderId: dummyUsers[2].id, content: 'わかりました！楽しみです！' },
    { senderId: dummyUsers[0].id, content: '当日よろしくお願いします！' },
  ]

  const baseDate1 = pastDate(48) // 2日前から
  for (let i = 0; i < group1Messages.length; i++) {
    const msg = group1Messages[i]
    const msgDate = new Date(baseDate1)
    msgDate.setMinutes(msgDate.getMinutes() + i * randomInt(10, 60))

    await prisma.message.create({
      data: {
        groupId: group1.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msgDate,
      },
    })
  }
  console.log(`   ✅ ${group1Recruitment.title} (${group1Messages.length}件のメッセージ)`)

  // グループ2: デモユーザーがメンバーとして参加
  const group2Recruitment = otherRecruitments[0]
  const group2 = await prisma.group.create({
    data: {
      recruitmentId: group2Recruitment.id,
      name: group2Recruitment.title,
    },
  })

  // 募集者をオーナーとして追加
  await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      userId: group2Recruitment.creatorId,
      role: GroupMemberRole.OWNER,
      lastReadAt: new Date(),
    },
  })

  // デモユーザーをメンバーとして追加
  await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      userId: demoUser.id,
      role: GroupMemberRole.MEMBER,
      lastReadAt: new Date(),
    },
  })

  // 申請も作成（承認済み）
  await prisma.application.create({
    data: {
      recruitmentId: group2Recruitment.id,
      applicantId: demoUser.id,
      status: ApplicationStatus.APPROVED,
      message: '参加させてください！映画好きです。',
      respondedAt: pastDate(24),
    },
  })

  // 他のメンバーを追加
  await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      userId: dummyUsers[2].id,
      role: GroupMemberRole.MEMBER,
      lastReadAt: pastDate(2),
    },
  })

  // チャットメッセージを追加
  const group2Messages = [
    { senderId: dummyUsers[0].id, content: 'グループへようこそ！' },
    { senderId: demoUser.id, content: 'ありがとうございます！参加できてうれしいです。' },
    { senderId: dummyUsers[2].id, content: 'よろしくお願いします！' },
    { senderId: dummyUsers[0].id, content: '今週末の映画、何を見ましょうか？' },
    { senderId: demoUser.id, content: '最近話題のアクション映画はどうですか？' },
    { senderId: dummyUsers[2].id, content: 'いいですね！それにしましょう！' },
    { senderId: dummyUsers[0].id, content: '土曜の14時からの回でいかがですか？' },
    { senderId: demoUser.id, content: 'OKです！楽しみにしています！' },
  ]

  const baseDate2 = pastDate(24) // 1日前から
  for (let i = 0; i < group2Messages.length; i++) {
    const msg = group2Messages[i]
    const msgDate = new Date(baseDate2)
    msgDate.setMinutes(msgDate.getMinutes() + i * randomInt(15, 45))

    await prisma.message.create({
      data: {
        groupId: group2.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msgDate,
      },
    })
  }
  console.log(`   ✅ ${group2Recruitment.title} (${group2Messages.length}件のメッセージ)`)

  // === 通知を作成 ===
  console.log('')
  console.log('🔔 通知を作成中...')

  const notifications = [
    {
      type: NotificationType.APPLICATION_RECEIVED,
      title: '新しい参加申請',
      body: `${dummyUsers[3].nickname}さんが「${createdRecruitments[1].title}」に参加申請しました`,
      data: { recruitmentId: createdRecruitments[1].id },
      isRead: false,
    },
    {
      type: NotificationType.APPLICATION_APPROVED,
      title: '申請が承認されました',
      body: `「${group2Recruitment.title}」への参加が承認されました`,
      data: { recruitmentId: group2Recruitment.id },
      isRead: true,
    },
    {
      type: NotificationType.GROUP_CREATED,
      title: 'グループが作成されました',
      body: `「${group1Recruitment.title}」のグループが作成されました`,
      data: { recruitmentId: group1Recruitment.id },
      isRead: true,
    },
    {
      type: NotificationType.NEW_MESSAGE,
      title: '新着メッセージ',
      body: `${dummyUsers[0].nickname}さんからメッセージが届きました`,
      data: { groupId: group1.id },
      isRead: false,
    },
  ]

  for (let i = 0; i < notifications.length; i++) {
    const notif = notifications[i]
    await prisma.notification.create({
      data: {
        userId: demoUser.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        data: notif.data,
        isRead: notif.isRead,
        createdAt: pastDate(i * 3 + 1),
      },
    })
  }
  console.log(`   ✅ ${notifications.length}件の通知を作成`)

  // === 申請を作成（デモユーザーの募集への申請） ===
  console.log('')
  console.log('📨 参加申請を作成中...')

  await prisma.application.create({
    data: {
      recruitmentId: createdRecruitments[1].id,
      applicantId: dummyUsers[3].id,
      status: ApplicationStatus.PENDING,
      message: 'カフェ巡り参加したいです！',
    },
  })
  console.log(`   ✅ ${dummyUsers[3].nickname}さんからの申請`)

  await prisma.application.create({
    data: {
      recruitmentId: createdRecruitments[2].id,
      applicantId: dummyUsers[4].id,
      status: ApplicationStatus.PENDING,
      message: 'フットサル初心者ですが参加したいです！',
    },
  })
  console.log(`   ✅ ${dummyUsers[4].nickname}さんからの申請`)

  // === 完了 ===
  console.log('')
  console.log('=' .repeat(50))
  console.log('✅ デモデータの投入が完了しました！')
  console.log('')
  console.log('📋 作成されたデータ:')
  console.log(`   - 募集（自分）: ${createdRecruitments.length}件`)
  console.log(`   - 募集（他者）: ${otherRecruitments.length}件`)
  console.log(`   - やりたいこと: ${wantToDoData.length}件`)
  console.log(`   - グループ: 2件`)
  console.log(`   - 通知: ${notifications.length}件`)
  console.log(`   - 参加申請: 2件`)
  console.log('')
  console.log('📱 アプリで確認できる機能:')
  console.log('   1. ホームタブ: 募集一覧（自分の募集3件 + 他者の募集2件）')
  console.log('   2. 探索タブ: 地図上に募集・やりたいことが表示')
  console.log('   3. グループタブ: 2つのグループチャット（計18件のメッセージ）')
  console.log('   4. 通知: 未読・既読の通知')
  console.log('   5. プロフィール: プロフィール編集')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
