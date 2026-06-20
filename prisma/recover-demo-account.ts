/**
 * Apple審査用デモアカウントを「ログインできる状態」に復旧するスクリプト
 *
 * 背景:
 *   審査でログインが `Invalid login credentials` で失敗。確認したところ
 *   Supabase Auth / DB の双方に gedozu@appmail.uk が存在しなかった。
 *   ログインは Supabase Auth(auth.users) を見るため、まず Auth に
 *   「メール確認済み」アカウントを作る必要がある。
 *
 * このスクリプトがやること:
 *   1. Supabase Auth にデモユーザーを作成（email_confirm: true で確認済み）。
 *      既に存在する場合はパスワードを再設定し confirmed 化する。
 *   2. Prisma User 行を upsert（id = Auth uid, isOnboarded: true）。
 *      オンボーディング画面で止まらないよう area / location / interests を投入。
 *
 * このあと別途 `seed-demo-account.ts` を実行して募集・チャット等のデモデータを投入する。
 *
 * 使い方（本番環境変数を渡して実行）:
 *   SUPABASE_URL="https://<project>.supabase.co" \
 *   SUPABASE_SECRET_KEY="<service-role-or-secret-key>" \
 *   DATABASE_URL="postgresql://..." \
 *   npx ts-node prisma/recover-demo-account.ts
 *
 * 注意:
 *   - SUPABASE_URL は本番ビルド(Build 37)が参照する EAS Secret の URL と
 *     必ず一致させること（別プロジェクトに作っても審査では弾かれる）。
 *   - SUPABASE_SECRET_KEY は service role 相当のキー（Project Settings > API）。
 */

import { PrismaClient, Area } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'gedozu@appmail.uk'
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Pass1234'

// オンボ済み扱いにするための初期プロフィール（仙台エリア）
const DEMO_PROFILE = {
  nickname: 'デモユーザー',
  bio: '仙台でいろいろなことを楽しみたいです！',
  area: Area.SENDAI,
  latitude: 38.2601,
  longitude: 140.8821,
  locationName: '仙台駅',
}

// 興味カテゴリ（seed.ts の固定id: 1=ボードゲーム,2=カフェ,3=飲み会,4=スポーツ,6=映画）
const DEMO_INTEREST_CATEGORY_IDS = ['1', '2', '3', '4', '6']

const prisma = new PrismaClient()

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`)
  }
  return value
}

/**
 * Supabase Auth にデモユーザーを用意し uid を返す。
 * 既存の場合はパスワード再設定＋メール確認済み化する。
 */
async function ensureAuthUser(): Promise<string> {
  const supabaseUrl = getEnv('SUPABASE_URL')
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secretKey) {
    throw new Error(
      '環境変数 SUPABASE_SECRET_KEY (または SUPABASE_SERVICE_ROLE_KEY) が設定されていません'
    )
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`🔐 Supabase Auth にデモユーザーを作成中: ${DEMO_EMAIL}`)
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  })

  if (!error && data.user) {
    console.log(`   ✅ 新規作成しました (uid: ${data.user.id})`)
    return data.user.id
  }

  // 既に登録済みの場合は探して更新する
  const alreadyExists =
    error && /already|exist|registered/i.test(error.message)
  if (!alreadyExists) {
    throw new Error(`Supabase Auth ユーザー作成に失敗: ${error?.message}`)
  }

  console.log('   ⚠️ 既に存在 → パスワード再設定 + メール確認済み化します')
  const existing = await findAuthUserByEmail(admin)
  if (!existing) {
    throw new Error(
      `既存と判定されたが ${DEMO_EMAIL} を Auth 内で特定できませんでした`
    )
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    existing.id,
    { password: DEMO_PASSWORD, email_confirm: true }
  )
  if (updateError) {
    throw new Error(`Supabase Auth ユーザー更新に失敗: ${updateError.message}`)
  }
  console.log(`   ✅ 更新しました (uid: ${existing.id})`)
  return existing.id
}

/**
 * ページングしながら Auth ユーザーをメールで検索する。
 */
async function findAuthUserByEmail(
  admin: ReturnType<typeof createClient>
): Promise<{ id: string } | null> {
  const perPage = 200
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`Auth ユーザー一覧取得に失敗: ${error.message}`)
    }
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase()
    )
    if (match) {
      return { id: match.id }
    }
    if (data.users.length < perPage) {
      break
    }
  }
  return null
}

/**
 * Prisma User 行を upsert（オンボ済み状態）。
 */
async function ensurePrismaUser(authUid: string): Promise<void> {
  console.log(`👤 Prisma User を upsert 中 (id: ${authUid})`)

  const user = await prisma.user.upsert({
    where: { id: authUid },
    update: {
      email: DEMO_EMAIL,
      ...DEMO_PROFILE,
      isOnboarded: true,
      agreedToTermsAt: new Date(),
    },
    create: {
      id: authUid,
      email: DEMO_EMAIL,
      ...DEMO_PROFILE,
      isOnboarded: true,
      agreedToTermsAt: new Date(),
    },
  })
  console.log(`   ✅ ${user.nickname} (isOnboarded: ${user.isOnboarded})`)

  console.log('🏷️  興味カテゴリを設定中...')
  for (const categoryId of DEMO_INTEREST_CATEGORY_IDS) {
    try {
      await prisma.userCategory.upsert({
        where: { userId_categoryId: { userId: authUid, categoryId } },
        update: {},
        create: { userId: authUid, categoryId },
      })
    } catch (error) {
      // カテゴリ未シードなどの場合はスキップ（seed.ts 実行で解消）
      console.warn(`   ⚠️ categoryId=${categoryId} をスキップ:`, error)
    }
  }
  console.log(`   ✅ ${DEMO_INTEREST_CATEGORY_IDS.length}件処理`)
}

async function main(): Promise<void> {
  console.log('🛠️  デモアカウント復旧スクリプト')
  console.log(`📧 ${DEMO_EMAIL}`)
  console.log('')

  const authUid = await ensureAuthUser()
  await ensurePrismaUser(authUid)

  console.log('')
  console.log('='.repeat(50))
  console.log('✅ 復旧完了。次の手順:')
  console.log('   1. デモデータ投入:')
  console.log(
    `      DATABASE_URL="..." npx ts-node prisma/seed-demo-account.ts`
  )
  console.log('   2. TestFlight の Build 37 で実機ログインを確認')
  console.log(`      email: ${DEMO_EMAIL} / password: ${DEMO_PASSWORD}`)
  console.log('   3. App Store Connect で返信・再提出')
}

main()
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
