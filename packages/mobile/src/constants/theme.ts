// デザインガイドライン準拠 - フォレスト＆クリーム
export const colors = {
  // プライマリ（フォレストグリーン系）
  primary: {
    50: '#F0F5F1',   // セクション背景
    100: '#D5E5D8',  // カード背景、ホバー
    200: '#A8C9AE',  // ボーダー、区切り線
    300: '#7BAD84',  // disabled状態
    400: '#5A9465',  // プレースホルダー
    500: '#3D7A4A',  // セカンダリテキスト
    600: '#2D6A4F',  // プライマリCTA
    700: '#245A42',  // ホバー時
    800: '#1B4332',  // 強調テキスト
    900: '#132D23',  // 見出し
    950: '#0D1F18',  // 最も濃い
  },
  // アクセント（ウォームベージュ系）
  accent: {
    50: '#FEF9F3',   // 軽いハイライト
    100: '#F9EED8',  // バッジ背景
    500: '#DDA15E',  // アイコン
    600: '#BC6C25',  // セカンダリCTA
    700: '#9A5A1F',  // ホバー時
  },
  // 背景色
  background: '#FEFDFB',  // メイン背景（ほぼ白のクリーム）
  surface: '#FAF8F5',     // カード背景
  // 基本色
  white: '#FFFFFF',
  black: '#000000',
  // ステータスカラー
  success: {
    50: '#D5E5D8',
    500: '#3D7A4A',
    600: '#2D6A4F',
  },
  warning: {
    50: '#FEF3C7',
    500: '#D97706',
    600: '#B45309',
  },
  error: {
    50: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },
  // マップマーカー用（視認性重視）
  marker: {
    recruitment: '#FF6B35',  // 募集（オレンジ）
    wantToDo: '#2D6A4F',     // 誘われ待ち（プライマリ緑）
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
