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

// カテゴリ定義（@machi/sharedからインポートできない環境向けにインライン定義）
// iconはMDIアイコン名
const CATEGORIES = [
  { id: '1', name: 'ボードゲーム', icon: 'mdiDice6' },
  { id: '2', name: 'カフェ', icon: 'mdiCoffee' },
  { id: '3', name: '飲み会', icon: 'mdiGlassMugVariant' },
  { id: '4', name: 'スポーツ', icon: 'mdiSoccer' },
  { id: '5', name: 'ゲーム', icon: 'mdiGamepadVariant' },
  { id: '6', name: '映画', icon: 'mdiMovie' },
  { id: '7', name: '読書', icon: 'mdiBookOpenPageVariant' },
  { id: '8', name: '音楽', icon: 'mdiMusic' },
  { id: '9', name: 'ランニング', icon: 'mdiRun' },
  { id: '10', name: '筋トレ', icon: 'mdiWeightLifter' },
  { id: '11', name: 'ヨガ', icon: 'mdiYoga' },
  { id: '12', name: 'カメラ', icon: 'mdiCamera' },
  { id: '13', name: 'アート', icon: 'mdiPalette' },
  { id: '14', name: 'プログラミング', icon: 'mdiLaptop' },
  { id: '15', name: '勉強会', icon: 'mdiForum' },
]

// 仙台エリアの主要スポット（緯度経度）
const SENDAI_LOCATIONS = [
  { name: '仙台駅', lat: 38.2601, lng: 140.8821 },
  { name: '広瀬通駅', lat: 38.261, lng: 140.8736 },
  { name: '勾当台公園駅', lat: 38.2669, lng: 140.8704 },
  { name: '北四番丁駅', lat: 38.2728, lng: 140.8682 },
  { name: '長町駅', lat: 38.2305, lng: 140.8799 },
  { name: '泉中央駅', lat: 38.3251, lng: 140.881 },
  { name: '八乙女駅', lat: 38.3136, lng: 140.8792 },
  { name: '北仙台駅', lat: 38.278, lng: 140.8717 },
  { name: '東照宮駅', lat: 38.2825, lng: 140.8813 },
  { name: '愛子駅', lat: 38.2656, lng: 140.7688 },
  { name: '仙台アーケード', lat: 38.2621, lng: 140.8765 },
  { name: '国分町', lat: 38.265, lng: 140.8698 },
  { name: '東北大学', lat: 38.2553, lng: 140.8393 },
  { name: '仙台城跡', lat: 38.2522, lng: 140.8565 },
  { name: '楽天モバイルパーク', lat: 38.2569, lng: 140.9011 },
]

// ダミーユーザー名
const NICKNAMES = [
  'ゆうき',
  'はると',
  'そうた',
  'れん',
  'みなと',
  'さくら',
  'ゆい',
  'あおい',
  'ひまり',
  'めい',
  'たくや',
  'こうき',
  'りょうた',
  'かいと',
  'しょうた',
  'はな',
  'りこ',
  'ももか',
  'ゆな',
  'ことね',
  'だいき',
  'けんた',
  'ゆうと',
  'そら',
  'りく',
]

// Bio例
const BIOS = [
  '仙台在住です。新しい趣味仲間を探しています！',
  '休日は趣味を楽しんでいます。気軽に声かけてください',
  '仙台で活動しています。よろしくお願いします！',
  '色々なことに挑戦するのが好きです',
  '週末は暇してることが多いです',
  '仙台に引っ越してきたばかりです。友達募集中！',
  'アクティブに活動するのが好きです',
  'まったり過ごすのも好きです',
  null,
  null,
]

// 募集タイトル例
const RECRUITMENT_TITLES: Record<string, string[]> = {
  '1': ['ボドゲ会やりませんか？', '初心者歓迎！ボードゲーム会', 'カタン一緒にやりましょう'],
  '2': ['カフェ巡り仲間募集', 'おしゃれカフェでお茶しませんか', '新しいカフェ開拓したい'],
  '3': ['今週末飲み行きませんか', '仙台駅周辺で飲み会', '軽く一杯どうですか'],
  '4': ['フットサル一緒にやりませんか', 'バスケメンバー募集', 'テニス仲間探してます'],
  '5': ['ゲーム好き集まれ！', 'スマブラオフ会', 'モンハン一緒にやりましょう'],
  '6': ['映画鑑賞会しませんか', '話題の新作観に行きませんか', 'ミニシアター巡り'],
  '7': ['読書会メンバー募集', '本好き集まれ！', 'おすすめの本を語り合いましょう'],
  '8': ['ライブ一緒に行きませんか', 'カラオケ行きましょう', 'ジャズ好きな方'],
  '9': ['朝ランしませんか', '広瀬川沿いをランニング', 'ゆるジョグ仲間募集'],
  '10': ['ジム仲間募集', '一緒に筋トレしませんか', 'ホームトレーニング仲間'],
  '11': ['ヨガクラス一緒に', '朝ヨガしませんか', 'リラックスヨガ'],
  '12': ['フォトウォークしませんか', '仙台の風景撮影', 'カメラ好き集合'],
  '13': ['美術館巡り', 'スケッチ会しませんか', 'アート好き集まれ'],
  '14': ['もくもく会やりませんか', 'プログラミング勉強会', 'LT会やりましょう'],
  '15': ['勉強会しませんか', '読書＆ディスカッション', '技術系勉強会'],
}

// 表明コメント例
const WANT_TO_DO_COMMENTS: Record<string, string[]> = {
  '1': ['ボードゲームやりたいです！初心者です', 'カタンやりたい', 'ボドゲカフェ行きたい'],
  '2': ['カフェでまったりしたい', '新しいカフェ開拓したいな', 'おすすめのカフェ教えてください'],
  '3': ['飲みに行きたいな', '誰か飲みませんか', '居酒屋行きたい'],
  '4': ['運動不足なので体動かしたい', 'スポーツしたい', '一緒に運動しませんか'],
  '5': ['ゲームしたい', 'オンラインでもオフでも', '対戦ゲームやりたい'],
  '6': ['映画見たい', '映画館行きたいな', '話題作が気になる'],
  '7': ['読書会参加したい', '本の話がしたい', 'おすすめ教えてほしい'],
  '8': ['音楽の話がしたい', 'ライブ行きたい', 'カラオケ行きたいな'],
  '9': ['ランニング仲間ほしい', '一緒に走りたい', '朝ラン始めたい'],
  '10': ['筋トレ仲間ほしい', 'ジム友ほしい', '一緒にトレーニングしたい'],
  '11': ['ヨガに興味あります', '体を柔らかくしたい', 'リラックスしたい'],
  '12': ['写真撮りに行きたい', 'カメラ持って散歩したい', '撮影スポット知りたい'],
  '13': ['美術館行きたい', 'アート見たい', '創作活動したい'],
  '14': ['プログラミング仲間ほしい', 'もくもく会したい', '技術の話がしたい'],
  '15': ['勉強会参加したい', '一緒に学びたい', 'スキルアップしたい'],
}

// メッセージ例（会話の流れを意識）
const SAMPLE_MESSAGES_INTRO = [
  'はじめまして！よろしくお願いします！',
  '参加できてうれしいです！',
  'よろしくお願いします〜',
  '今回初参加です。よろしくです！',
  'わくわくしています！',
]

const SAMPLE_MESSAGES_PLANNING = [
  '日程調整しましょうか',
  '場所はどこがいいですかね？',
  '今週末って皆さん空いてますか？',
  '仙台駅周辺とかどうですか？',
  '何時スタートにしましょう？',
  '13時集合でいかがでしょうか',
  '了解です！',
  'OKです！',
  'いいですね〜',
  'それで大丈夫です',
]

const SAMPLE_MESSAGES_DETAILS = [
  '何か持っていくものありますか？',
  '特に持ち物は必要ないと思います',
  '動きやすい服装で来てください',
  '初めてなので緊張しています',
  '私も初めてなので安心してください！',
  '楽しみにしています！',
  '当日よろしくお願いします',
  '集合場所はあとで共有しますね',
  '天気良さそうでよかった',
  '雨だったら室内に変更しましょう',
]

const SAMPLE_MESSAGES_CONFIRM = [
  'ありがとうございます！',
  '楽しみにしてます！',
  '明日よろしくお願いします',
  '皆さんよろしくです！',
  '今日はありがとうございました！また次回も参加したいです',
  '楽しかったです！またやりましょう！',
  '次回の予定も立てましょうか',
]

const ALL_MESSAGES = [
  ...SAMPLE_MESSAGES_INTRO,
  ...SAMPLE_MESSAGES_PLANNING,
  ...SAMPLE_MESSAGES_DETAILS,
  ...SAMPLE_MESSAGES_CONFIRM,
]

// ランダムに配列から要素を取得
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 範囲内のランダム整数
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 位置を少しずらす（同じ場所に集中しないように）
function jitterLocation(lat: number, lng: number): { lat: number; lng: number } {
  const jitter = 0.005 // 約500m程度のずれ
  return {
    lat: lat + (Math.random() - 0.5) * jitter * 2,
    lng: lng + (Math.random() - 0.5) * jitter * 2,
  }
}

// 将来の日時を生成
function futureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(randomInt(10, 21), randomInt(0, 1) * 30, 0, 0)
  return date
}

// 過去の日時を生成
function pastDate(daysAgo: number, hoursAgo: number = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(date.getHours() - hoursAgo)
  return date
}

async function seedTestData() {
  console.log('🧪 Creating test data for Sendai area...')

  // 既存のテストデータを削除
  console.log('🗑️ Cleaning up existing test data...')
  await prisma.notification.deleteMany({
    where: { user: { email: { startsWith: 'test_' } } },
  })
  await prisma.message.deleteMany({
    where: { sender: { email: { startsWith: 'test_' } } },
  })
  await prisma.groupMember.deleteMany({
    where: { user: { email: { startsWith: 'test_' } } },
  })
  await prisma.group.deleteMany({
    where: { recruitment: { creator: { email: { startsWith: 'test_' } } } },
  })
  await prisma.offer.deleteMany({
    where: { sender: { email: { startsWith: 'test_' } } },
  })
  await prisma.application.deleteMany({
    where: { applicant: { email: { startsWith: 'test_' } } },
  })
  await prisma.wantToDo.deleteMany({
    where: { user: { email: { startsWith: 'test_' } } },
  })
  await prisma.recruitment.deleteMany({
    where: { creator: { email: { startsWith: 'test_' } } },
  })
  await prisma.userCategory.deleteMany({
    where: { user: { email: { startsWith: 'test_' } } },
  })
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test_' } },
  })

  // テストユーザーを作成（25人）
  const users: { id: string; nickname: string; email: string }[] = []
  for (let i = 0; i < 25; i++) {
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const user = await prisma.user.create({
      data: {
        email: `test_user_${i}@example.com`,
        nickname: NICKNAMES[i],
        bio: randomPick(BIOS),
        area: Area.SENDAI,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        isOnboarded: true,
      },
    })
    users.push({ id: user.id, nickname: user.nickname ?? '', email: user.email })
  }
  console.log(`✅ Created ${users.length} test users`)

  // ユーザーに興味カテゴリを設定（各ユーザーに2-5個）
  for (const user of users) {
    const categoryCount = randomInt(2, 5)
    const categoryIds = new Set<string>()
    while (categoryIds.size < categoryCount) {
      categoryIds.add(String(randomInt(1, 15)))
    }
    for (const categoryId of categoryIds) {
      await prisma.userCategory.create({
        data: {
          userId: user.id,
          categoryId,
        },
      })
    }
  }
  console.log(`✅ Assigned interest categories to users`)

  // 募集を作成（20件）- IDを保持
  const recruitments: {
    id: string
    creatorId: string
    categoryId: string
    title: string
  }[] = []
  for (let i = 0; i < 20; i++) {
    const creator = users[i % users.length]
    const categoryId = String(randomInt(1, 15))
    const titles = RECRUITMENT_TITLES[categoryId]
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)
    const maxPeople = randomInt(3, 8)
    const title = randomPick(titles)

    const recruitment = await prisma.recruitment.create({
      data: {
        creatorId: creator.id,
        categoryId,
        title,
        description: `${creator.nickname}です。一緒に楽しみましょう！`,
        datetime: Math.random() > 0.3 ? futureDate(randomInt(1, 14)) : null,
        datetimeFlex: Math.random() > 0.5 ? '週末のどこかで' : null,
        area: Area.SENDAI,
        location: location.name,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        minPeople: 1,
        maxPeople,
        status: RecruitmentStatus.OPEN,
      },
    })
    recruitments.push({
      id: recruitment.id,
      creatorId: creator.id,
      categoryId,
      title,
    })
  }
  console.log(`✅ Created ${recruitments.length} recruitments`)

  // 表明を作成（30件）- 提案機能のテスト用に募集と同じカテゴリの表明を作成
  const timings: Timing[] = [Timing.THIS_WEEK, Timing.NEXT_WEEK, Timing.THIS_MONTH, Timing.ANYTIME]
  let wantToDoCount = 0
  for (let i = 0; i < 30; i++) {
    // 募集作成者以外のユーザーを選ぶ
    const userIndex = (i + 5) % users.length
    const user = users[userIndex]
    // 一部は募集と同じカテゴリにする（提案機能テスト用）
    const categoryId = i < 10 ? recruitments[i % recruitments.length].categoryId : String(randomInt(1, 15))
    const comments = WANT_TO_DO_COMMENTS[categoryId]
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.wantToDo.create({
      data: {
        userId: user.id,
        categoryId,
        timing: randomPick(timings),
        comment: Math.random() > 0.2 ? randomPick(comments) : null,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        expiresAt,
      },
    })
    wantToDoCount++
  }
  console.log(`✅ Created ${wantToDoCount} want-to-dos`)

  // 参加申請を作成（様々なステータス）
  let applicationCount = 0
  for (let i = 0; i < 15; i++) {
    const recruitment = recruitments[i % recruitments.length]
    // 募集者以外のユーザーを選ぶ
    const applicant = users.find((u) => u.id !== recruitment.creatorId)!

    // 既存の申請があるかチェック
    const existing = await prisma.application.findUnique({
      where: {
        recruitmentId_applicantId: {
          recruitmentId: recruitment.id,
          applicantId: applicant.id,
        },
      },
    })
    if (existing) continue

    const statuses: ApplicationStatus[] = [
      ApplicationStatus.PENDING,
      ApplicationStatus.PENDING,
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
    ]
    const status = randomPick(statuses)

    await prisma.application.create({
      data: {
        recruitmentId: recruitment.id,
        applicantId: applicant.id,
        status,
        message: '参加させてください！よろしくお願いします。',
        respondedAt: status !== ApplicationStatus.PENDING ? pastDate(randomInt(0, 3)) : null,
      },
    })
    applicationCount++
  }
  console.log(`✅ Created ${applicationCount} applications`)

  // オファーを作成（様々なステータス）
  let offerCount = 0
  for (let i = 0; i < 12; i++) {
    const recruitment = recruitments[i % recruitments.length]
    // 募集者以外のユーザーを選ぶ（申請者とも違うユーザー）
    const receiverIndex = (i + 10) % users.length
    const receiver = users[receiverIndex]
    if (receiver.id === recruitment.creatorId) continue

    // 既存のオファーがあるかチェック
    const existing = await prisma.offer.findUnique({
      where: {
        recruitmentId_receiverId: {
          recruitmentId: recruitment.id,
          receiverId: receiver.id,
        },
      },
    })
    if (existing) continue

    const statuses: OfferStatus[] = [
      OfferStatus.PENDING,
      OfferStatus.PENDING,
      OfferStatus.ACCEPTED,
      OfferStatus.DECLINED,
    ]
    const status = randomPick(statuses)

    await prisma.offer.create({
      data: {
        recruitmentId: recruitment.id,
        senderId: recruitment.creatorId,
        receiverId: receiver.id,
        status,
        message: 'ぜひ参加しませんか？',
        respondedAt: status !== OfferStatus.PENDING ? pastDate(randomInt(0, 3)) : null,
      },
    })
    offerCount++
  }
  console.log(`✅ Created ${offerCount} offers`)

  // グループを作成（承認済み申請または承諾済みオファーがある募集から）
  // グループ数を8に増やし、メッセージも充実させる
  const groupRecruitments = recruitments.slice(0, 8)
  let groupCount = 0
  let totalMessageCount = 0
  for (const recruitment of groupRecruitments) {
    // グループ作成
    const group = await prisma.group.create({
      data: {
        recruitmentId: recruitment.id,
        name: recruitment.title,
      },
    })

    // オーナーをメンバーとして追加
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: recruitment.creatorId,
        role: GroupMemberRole.OWNER,
        lastReadAt: new Date(),
      },
    })

    // 他のメンバーを追加（3-5人）
    const memberCount = randomInt(3, 5)
    const addedMembers = new Set<string>([recruitment.creatorId])

    for (let j = 0; j < memberCount; j++) {
      const member = users[(groupCount * 5 + j + 3) % users.length]
      if (addedMembers.has(member.id)) continue
      addedMembers.add(member.id)

      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: member.id,
          role: GroupMemberRole.MEMBER,
          // 一部のメンバーは古いlastReadAtにして未読メッセージをテスト
          lastReadAt: j === 0 ? pastDate(0, 2) : new Date(),
        },
      })
    }

    // メッセージを追加（各グループに15-25件）
    // 会話の流れを意識：挨拶 → 計画 → 詳細 → 確認
    const memberIds = Array.from(addedMembers)
    const messageSequence: string[] = []

    // 1. 挨拶フェーズ（各メンバーが1回ずつ挨拶）
    for (let i = 0; i < memberIds.length; i++) {
      messageSequence.push(randomPick(SAMPLE_MESSAGES_INTRO))
    }

    // 2. 計画フェーズ（4-6件のやり取り）
    for (let i = 0; i < randomInt(4, 6); i++) {
      messageSequence.push(randomPick(SAMPLE_MESSAGES_PLANNING))
    }

    // 3. 詳細フェーズ（3-5件のやり取り）
    for (let i = 0; i < randomInt(3, 5); i++) {
      messageSequence.push(randomPick(SAMPLE_MESSAGES_DETAILS))
    }

    // 4. 確認フェーズ（2-4件のやり取り）
    for (let i = 0; i < randomInt(2, 4); i++) {
      messageSequence.push(randomPick(SAMPLE_MESSAGES_CONFIRM))
    }

    // メッセージを作成
    const baseDate = pastDate(randomInt(1, 5))
    for (let k = 0; k < messageSequence.length; k++) {
      const senderId = memberIds[k % memberIds.length]
      const msgDate = new Date(baseDate)
      msgDate.setMinutes(msgDate.getMinutes() + k * randomInt(5, 30))

      await prisma.message.create({
        data: {
          groupId: group.id,
          senderId,
          content: messageSequence[k],
          createdAt: msgDate,
        },
      })
      totalMessageCount++
    }

    groupCount++
  }
  console.log(`✅ Created ${groupCount} groups with ${totalMessageCount} messages`)

  // 通知を作成（各種類）
  let notificationCount = 0

  // 最初の5人のユーザーに様々な通知を作成
  for (let i = 0; i < 5; i++) {
    const user = users[i]
    const recruitment = recruitments[i]

    // 申請受信通知
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.APPLICATION_RECEIVED,
        title: '新しい参加申請',
        body: `${users[(i + 5) % users.length].nickname}さんが「${recruitment.title}」に参加申請しました`,
        data: { recruitmentId: recruitment.id },
        isRead: i % 2 === 0, // 半分は既読
        createdAt: pastDate(0, i),
      },
    })
    notificationCount++

    // オファー受信通知
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.OFFER_RECEIVED,
        title: 'オファーが届きました',
        body: `${users[(i + 3) % users.length].nickname}さんから「${recruitments[(i + 1) % recruitments.length].title}」への参加オファーが届きました`,
        data: { recruitmentId: recruitments[(i + 1) % recruitments.length].id },
        isRead: false,
        createdAt: pastDate(0, i + 2),
      },
    })
    notificationCount++

    // 申請承認通知
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.APPLICATION_APPROVED,
        title: '申請が承認されました',
        body: `「${recruitments[(i + 2) % recruitments.length].title}」への参加が承認されました`,
        data: { recruitmentId: recruitments[(i + 2) % recruitments.length].id },
        isRead: i % 3 === 0,
        createdAt: pastDate(1, i),
      },
    })
    notificationCount++

    // グループ作成通知
    if (i < groupCount) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.GROUP_CREATED,
          title: 'グループが作成されました',
          body: `「${groupRecruitments[i].title}」のグループが作成されました`,
          data: { recruitmentId: groupRecruitments[i].id },
          isRead: false,
          createdAt: pastDate(0, i + 5),
        },
      })
      notificationCount++
    }

    // 新着メッセージ通知
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.NEW_MESSAGE,
        title: '新着メッセージ',
        body: `${users[(i + 7) % users.length].nickname}さんからメッセージが届きました`,
        data: {},
        isRead: false,
        createdAt: pastDate(0, 1),
      },
    })
    notificationCount++
  }
  console.log(`✅ Created ${notificationCount} notifications`)

  console.log('🧪 Test data seeding completed!')
  console.log('')
  console.log('📋 テストデータ概要:')
  console.log(`   - ユーザー: ${users.length}人 (test_user_0〜24@example.com)`)
  console.log(`   - 募集: ${recruitments.length}件`)
  console.log(`   - やりたいこと表明: ${wantToDoCount}件`)
  console.log(`   - 参加申請: ${applicationCount}件`)
  console.log(`   - オファー: ${offerCount}件`)
  console.log(`   - グループ: ${groupCount}件`)
  console.log(`   - メッセージ: ${totalMessageCount}件`)
  console.log(`   - 通知: ${notificationCount}件`)
  console.log('')
  console.log('💡 動作確認用ユーザー（Supabaseでログイン後に確認）:')
  console.log('   test_user_0@example.com - 募集作成者、グループオーナー、通知あり')
  console.log('   test_user_1@example.com - 募集作成者、グループオーナー、通知あり')
  console.log('   test_user_3@example.com - グループメンバー（複数グループに参加）')
  console.log('   test_user_5@example.com - やりたいこと表明あり（提案テスト用）')
  console.log('')
  console.log('⚠️ 注意: テストユーザーはSupabase Authには登録されていません')
  console.log('   実際にログインするには、ご自身のアカウントでログイン後、')
  console.log('   DBのテストユーザーのemailを自分のものに変更するか、')
  console.log('   新規にグループやチャットを作成してテストしてください')
}

// 特定のユーザーを参加中状態にする（グループ・チャットデータ作成）
async function createParticipatingDataForUser(userEmail: string) {
  console.log(`\n🎯 Creating participating data for: ${userEmail}`)

  // ユーザーを取得
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
  })

  if (!user) {
    console.log(`❌ User not found: ${userEmail}`)
    return
  }

  console.log(`✅ Found user: ${user.nickname} (${user.id})`)

  // 既存の募集を取得（グループがまだないもの優先）
  const recruitmentsWithoutGroup = await prisma.recruitment.findMany({
    where: {
      status: RecruitmentStatus.OPEN,
      group: null,
      creatorId: { not: user.id }, // 自分が作成者でない募集
    },
    include: {
      creator: true,
      category: true,
    },
    take: 3,
  })

  // 自分が作成した募集も取得
  const myRecruitments = await prisma.recruitment.findMany({
    where: {
      creatorId: user.id,
      group: null,
    },
    include: {
      creator: true,
      category: true,
    },
    take: 2,
  })

  const allRecruitments = [...recruitmentsWithoutGroup, ...myRecruitments]

  if (allRecruitments.length === 0) {
    console.log('❌ No suitable recruitments found. Creating new ones...')
    // 新しい募集を作成
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)

    const newRecruitment = await prisma.recruitment.create({
      data: {
        creatorId: user.id,
        categoryId: '1', // ボードゲーム
        title: 'ボドゲ会やりませんか？',
        description: '仙台でボードゲーム仲間を募集しています！',
        datetime: futureDate(randomInt(3, 10)),
        area: Area.SENDAI,
        location: location.name,
        latitude: jitteredLoc.lat,
        longitude: jitteredLoc.lng,
        locationName: location.name,
        minPeople: 2,
        maxPeople: 6,
        status: RecruitmentStatus.OPEN,
      },
      include: {
        creator: true,
        category: true,
      },
    })
    allRecruitments.push(newRecruitment)
  }

  let createdGroups = 0
  let createdMessages = 0

  for (const recruitment of allRecruitments) {
    // 既存のグループがあるかチェック
    const existingGroup = await prisma.group.findUnique({
      where: { recruitmentId: recruitment.id },
    })

    if (existingGroup) {
      // 既存グループにメンバーとして追加を試みる
      const existingMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: existingGroup.id,
            userId: user.id,
          },
        },
      })

      if (!existingMember) {
        await prisma.groupMember.create({
          data: {
            groupId: existingGroup.id,
            userId: user.id,
            role: GroupMemberRole.MEMBER,
            lastReadAt: new Date(),
          },
        })
        console.log(`  ➕ Added to existing group: ${existingGroup.name}`)
      }
      continue
    }

    // 新しいグループを作成
    const group = await prisma.group.create({
      data: {
        recruitmentId: recruitment.id,
        name: recruitment.title,
      },
    })

    // オーナーを追加
    const isOwner = recruitment.creatorId === user.id
    if (isOwner) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: GroupMemberRole.OWNER,
          lastReadAt: new Date(),
        },
      })
    } else {
      // 募集者をオーナーとして追加
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: recruitment.creatorId,
          role: GroupMemberRole.OWNER,
          lastReadAt: new Date(),
        },
      })
      // 自分をメンバーとして追加
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: GroupMemberRole.MEMBER,
          lastReadAt: new Date(),
        },
      })

      // 承認済み申請も作成
      await prisma.application.upsert({
        where: {
          recruitmentId_applicantId: {
            recruitmentId: recruitment.id,
            applicantId: user.id,
          },
        },
        update: {
          status: ApplicationStatus.APPROVED,
          respondedAt: new Date(),
        },
        create: {
          recruitmentId: recruitment.id,
          applicantId: user.id,
          status: ApplicationStatus.APPROVED,
          message: '参加させてください！',
          respondedAt: new Date(),
        },
      })
    }

    // 他のテストユーザーをメンバーとして追加（2-3人）
    const testUsers = await prisma.user.findMany({
      where: {
        email: { startsWith: 'test_' },
        id: { not: user.id, notIn: [recruitment.creatorId] },
      },
      take: randomInt(2, 3),
    })

    for (const testUser of testUsers) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: testUser.id,
          role: GroupMemberRole.MEMBER,
          lastReadAt: pastDate(0, randomInt(1, 5)),
        },
      })
    }

    // メッセージを作成（会話の流れ）
    const allMembers = [
      user,
      ...(isOwner ? [] : [recruitment.creator]),
      ...testUsers,
    ]

    const messages = [
      { sender: recruitment.creator, content: 'グループへようこそ！' },
      { sender: user, content: 'はじめまして！よろしくお願いします！' },
      { sender: testUsers[0], content: 'よろしくお願いします〜' },
      { sender: recruitment.creator, content: '日程調整しましょうか' },
      { sender: user, content: '今週末って皆さん空いてますか？' },
      { sender: testUsers[0], content: '土曜日なら大丈夫です！' },
      { sender: testUsers[1] || testUsers[0], content: '私も土曜OKです' },
      { sender: recruitment.creator, content: 'じゃあ土曜日にしましょう！' },
      { sender: user, content: 'いいですね！何時くらいがいいですかね？' },
      { sender: recruitment.creator, content: '13時集合でいかがでしょうか' },
      { sender: testUsers[0], content: '了解です！' },
      { sender: user, content: 'OKです！楽しみにしています' },
      { sender: testUsers[1] || testUsers[0], content: '場所はどこにしますか？' },
      { sender: recruitment.creator, content: `${recruitment.locationName || '仙台駅周辺'}にしましょうか` },
      { sender: user, content: 'いいですね！当日よろしくお願いします' },
    ]

    const baseDate = pastDate(randomInt(1, 3))
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (!msg.sender) continue

      const msgDate = new Date(baseDate)
      msgDate.setMinutes(msgDate.getMinutes() + i * randomInt(3, 15))

      await prisma.message.create({
        data: {
          groupId: group.id,
          senderId: msg.sender.id,
          content: msg.content,
          createdAt: msgDate,
        },
      })
      createdMessages++
    }

    createdGroups++
    console.log(`  ✅ Created group: ${group.name} with ${messages.length} messages`)
  }

  console.log(`\n📊 Created ${createdGroups} groups with ${createdMessages} messages for ${user.nickname}`)
}

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

  // テストデータの作成
  await seedTestData()

  // 環境変数でユーザーメールが指定されていれば、そのユーザー用のデータを作成
  const targetUserEmail = process.env.SEED_USER_EMAIL
  if (targetUserEmail) {
    await createParticipatingDataForUser(targetUserEmail)
  }

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
