/**
 * Supabase AuthとDBのユーザーIDを比較するスクリプト
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const TARGET_EMAIL = 'gedozu@appmail.uk'

async function main() {
  console.log('🔍 ユーザーID比較チェック')
  console.log(`📧 対象: ${TARGET_EMAIL}`)
  console.log('')

  // DBからユーザーを取得
  const dbUser = await prisma.user.findFirst({
    where: { email: TARGET_EMAIL },
  })

  if (!dbUser) {
    console.log('❌ DBにユーザーが見つかりません')
    return
  }

  console.log('📦 DBのユーザー:')
  console.log(`   ID: ${dbUser.id}`)
  console.log(`   Email: ${dbUser.email}`)
  console.log(`   Nickname: ${dbUser.nickname}`)
  console.log('')

  // Supabase Authからユーザーを取得
  const { data: authUsers, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.log('❌ Supabase Auth エラー:', error.message)
    return
  }

  const authUser = authUsers.users.find((u) => u.email === TARGET_EMAIL)

  if (!authUser) {
    console.log('❌ Supabase Authにユーザーが見つかりません')
    return
  }

  console.log('🔐 Supabase Authのユーザー:')
  console.log(`   ID: ${authUser.id}`)
  console.log(`   Email: ${authUser.email}`)
  console.log(`   Created: ${authUser.created_at}`)
  console.log('')

  // ID比較
  if (dbUser.id === authUser.id) {
    console.log('✅ IDが一致しています！')
  } else {
    console.log('❌ IDが不一致です！')
    console.log('')
    console.log('🔧 修正方法:')
    console.log(`   DBのユーザーID (${dbUser.id}) を`)
    console.log(`   Supabase AuthのユーザーID (${authUser.id}) に更新する必要があります`)
    console.log('')
    console.log('以下のSQLを実行してください:')
    console.log('')
    console.log(`   -- まず外部キー制約を持つ関連レコードを更新`)
    console.log(`   UPDATE "UserCategory" SET "userId" = '${authUser.id}' WHERE "userId" = '${dbUser.id}';`)
    console.log(`   UPDATE "WantToDo" SET "userId" = '${authUser.id}' WHERE "userId" = '${dbUser.id}';`)
    console.log(`   UPDATE "Recruitment" SET "creatorId" = '${authUser.id}' WHERE "creatorId" = '${dbUser.id}';`)
    console.log(`   UPDATE "Application" SET "applicantId" = '${authUser.id}' WHERE "applicantId" = '${dbUser.id}';`)
    console.log(`   UPDATE "Offer" SET "senderId" = '${authUser.id}' WHERE "senderId" = '${dbUser.id}';`)
    console.log(`   UPDATE "Offer" SET "receiverId" = '${authUser.id}' WHERE "receiverId" = '${dbUser.id}';`)
    console.log(`   UPDATE "GroupMember" SET "userId" = '${authUser.id}' WHERE "userId" = '${dbUser.id}';`)
    console.log(`   UPDATE "Message" SET "senderId" = '${authUser.id}' WHERE "senderId" = '${dbUser.id}';`)
    console.log(`   UPDATE "Notification" SET "userId" = '${authUser.id}' WHERE "userId" = '${dbUser.id}';`)
    console.log(`   -- 最後にユーザー本体を更新`)
    console.log(`   UPDATE "User" SET "id" = '${authUser.id}' WHERE "id" = '${dbUser.id}';`)
  }
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
