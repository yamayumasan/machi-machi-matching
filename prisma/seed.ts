import { PrismaClient, Area, Timing, RecruitmentStatus } from '@prisma/client'

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
  'ゆうき', 'はると', 'そうた', 'れん', 'みなと',
  'さくら', 'ゆい', 'あおい', 'ひまり', 'めい',
  'たくや', 'こうき', 'りょうた', 'かいと', 'しょうた',
  'はな', 'りこ', 'ももか', 'ゆな', 'ことね',
  'だいき', 'けんた', 'ゆうと', 'そら', 'りく',
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

async function seedTestData() {
  console.log('🧪 Creating test data for Sendai area...')

  // 既存のテストユーザーを削除（メールが test_ で始まるもの）
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'test_',
      },
    },
  })

  // テストユーザーを作成（25人）
  const users: { id: string; nickname: string }[] = []
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
    users.push({ id: user.id, nickname: user.nickname ?? '' })
  }
  console.log(`✅ Created ${users.length} test users`)

  // 募集を作成（30件）
  let recruitmentCount = 0
  for (let i = 0; i < 30; i++) {
    const creator = randomPick(users)
    const categoryId = String(randomInt(1, 15))
    const titles = RECRUITMENT_TITLES[categoryId]
    const location = randomPick(SENDAI_LOCATIONS)
    const jitteredLoc = jitterLocation(location.lat, location.lng)
    const maxPeople = randomInt(2, 8)

    await prisma.recruitment.create({
      data: {
        creatorId: creator.id,
        categoryId,
        title: randomPick(titles),
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
    recruitmentCount++
  }
  console.log(`✅ Created ${recruitmentCount} recruitments`)

  // 表明を作成（40件）
  const timings: Timing[] = [Timing.THIS_WEEK, Timing.NEXT_WEEK, Timing.THIS_MONTH, Timing.ANYTIME]
  let wantToDoCount = 0
  for (let i = 0; i < 40; i++) {
    const user = randomPick(users)
    const categoryId = String(randomInt(1, 15))
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

  console.log('🧪 Test data seeding completed!')
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
