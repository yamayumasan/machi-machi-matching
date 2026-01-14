// デザインガイドライン準拠 - モノトーン + 緑アクセント
export const colors = {
  // プライマリ（グレースケール）
  primary: {
    50: '#fafafa',    // 背景（明るい）
    100: '#f5f5f5',   // カードホバー
    200: '#e5e5e5',   // ボーダー、区切り線
    300: '#d4d4d4',   // disabled状態
    400: '#a3a3a3',   // プレースホルダー
    500: '#737373',   // セカンダリテキスト
    600: '#525252',   // サブテキスト
    700: '#404040',   // フォーカスリング
    800: '#262626',   // ボタンホバー
    900: '#171717',   // プライマリテキスト、CTAボタン
    950: '#0a0a0a',   // 最も濃い黒
  },
  // アクセント（緑）
  accent: {
    50: '#f0fdf4',    // 成功バッジ背景
    100: '#dcfce7',   // 軽いハイライト
    500: '#22c55e',   // アイコン
    600: '#16a34a',   // CTAアクセント、自分のチャット吹き出し
    700: '#15803d',   // ホバー時
  },
  // Gray (neutral)
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  white: '#ffffff',
  black: '#000000',
  // ステータスカラー
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fefce8',
    500: '#eab308',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}
