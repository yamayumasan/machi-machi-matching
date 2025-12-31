import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 遅延初期化用のキャッシュ
let _supabaseAdmin: SupabaseClient | null = null
let _supabase: SupabaseClient | null = null

const getSupabaseConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  // 新しいAPIキー形式に対応（旧形式もフォールバックとしてサポート）
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || ''

  return { supabaseUrl, supabaseSecretKey, supabasePublishableKey }
}

// シークレットキークライアント（サーバーサイド専用）- 遅延初期化
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    const { supabaseUrl, supabaseSecretKey } = getSupabaseConfig()
    _supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}

// 公開クライアント（トークン検証用）- 遅延初期化
export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig()
    _supabase = createClient(supabaseUrl, supabasePublishableKey)
  }
  return _supabase
}

// 後方互換性のためのエクスポート（遅延初期化版をプロキシ）
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const instance = getSupabaseAdmin()
    const value = (instance as any)[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const instance = getSupabase()
    const value = (instance as any)[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

// ユーザーのアクセストークンからSupabaseクライアントを作成
export const createSupabaseClientWithToken = (accessToken: string) => {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig()
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
