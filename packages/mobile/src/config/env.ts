/**
 * 環境設定
 *
 * __DEV__ を使用してローカル開発と本番を自動判別
 * .env ファイルの手動変更は不要
 */

// 開発モードかどうか（Expo/React Native の組み込みグローバル変数）
export const isDev = __DEV__

// 環境設定
export const config = {
  // API URL: 開発時はローカル、本番時は Railway
  apiUrl: isDev
    ? 'http://localhost:3000/api'
    : (process.env.EXPO_PUBLIC_API_URL || 'https://machiapi-production.up.railway.app/api'),

  // Supabase 設定（共通）
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

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
      interests: [],
    },
  },
} as const

// デバッグ出力
if (isDev) {
  console.log('[ENV] Development mode enabled')
  console.log('[ENV] API URL:', config.apiUrl)
  console.log('[ENV] Auto-login:', config.dev.autoLogin)
}
