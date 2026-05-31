/**
 * 環境設定
 *
 * __DEV__ を使用してローカル開発と本番を自動判別
 * .env ファイルの手動変更は不要
 */

// 開発モードかどうか（Expo/React Native の組み込みグローバル変数）
export const isDev = __DEV__

const supabaseUrlFromEnv = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKeyFromEnv = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// 環境設定
export const config = {
  // API URL: 開発時はローカル、本番時は Railway
  apiUrl: isDev
    ? 'http://localhost:3000/api'
    : (process.env.EXPO_PUBLIC_API_URL || 'https://machiapi-production.up.railway.app/api'),

  // Supabase 設定（共通）
  supabaseUrl: supabaseUrlFromEnv,
  supabaseAnonKey: supabaseAnonKeyFromEnv,

  // 開発モード専用設定
  dev: {
    // 自動ログインを有効にする
    autoLogin: isDev,

    // 開発用モックユーザー（DBのtest_user_0に対応）
    // 注: 実際のユーザーデータはAPIから取得するため、これは初期値のみ
    mockUser: {
      id: 'dev-user-placeholder',  // APIから実際のIDを取得
      email: 'test_user_0@example.com',
      nickname: 'ゆうき',
      avatar: null,
      bio: null,
      area: 'SENDAI' as const,
      latitude: 38.2682,
      longitude: 140.8694,
      isOnboarded: true,
      interests: [] as { id: string; name: string; icon: string }[],
    },
  },
} as const

/**
 * 起動時の env 健全性チェック。
 *
 * 本番ビルド（__DEV__ === false）で `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
 * が空の場合、Supabase auth の全リクエストが不正URLに飛び "ネットワークエラー" として現出する。
 * EAS ビルド時に env が注入されていない構成ミスを起動直後に検出する。
 */
export interface EnvHealth {
  ok: boolean
  missing: readonly string[]
}

// 値のプレビュー（先頭数文字 + 長さ）を生成する。診断用途のみ。
// anon key は本来クライアントに配布される公開鍵なので、prefixを露出しても問題ない。
const preview = (v: string, n = 8): string =>
  v.length === 0 ? '(empty)' : `${JSON.stringify(v.slice(0, n))}…(len=${v.length})`

export const getEnvHealth = (): EnvHealth => {
  const missing: string[] = []
  // URL: 非空かつ https://*.supabase.co 形式
  if (!supabaseUrlFromEnv || !supabaseUrlFromEnv.startsWith('https://')) {
    missing.push(`EXPO_PUBLIC_SUPABASE_URL got=${preview(supabaseUrlFromEnv, 24)}`)
  }
  // ANON KEY: 非空かつ JWT 形式（"eyJ" で始まる）
  if (!supabaseAnonKeyFromEnv || !supabaseAnonKeyFromEnv.startsWith('eyJ')) {
    missing.push(`EXPO_PUBLIC_SUPABASE_ANON_KEY got=${preview(supabaseAnonKeyFromEnv)}`)
  }
  return { ok: missing.length === 0, missing }
}

export const envHealth: EnvHealth = getEnvHealth()

// デバッグ出力 / 健全性チェック
if (isDev) {
  console.log('[ENV] Development mode enabled')
  console.log('[ENV] API URL:', config.apiUrl)
  console.log('[ENV] Auto-login:', config.dev.autoLogin)
  if (!envHealth.ok) {
    console.warn('[ENV] Missing Supabase env (dev fallbacks may apply):', envHealth.missing.join(', '))
  }
} else if (!envHealth.ok) {
  console.error(
    '[ENV] FATAL: required public env missing in production build:',
    envHealth.missing.join(', '),
    '— Supabase auth will fail. Check EAS Secrets configuration.'
  )
}
