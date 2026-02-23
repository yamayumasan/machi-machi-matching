// デザインガイドライン v3 準拠 - セージグリーン × テラコッタ（ナチュラル＆落ち着き）
export const colors = {
  // プライマリ（セージグリーン系）- 自然、穏やか、安心
  primary: {
    50: '#F0F5F0',   // セクション背景、軽いハイライト
    100: '#E1EBE1',  // カード背景、ホバー
    200: '#C3D7C3',  // ボーダー、区切り線
    300: '#A5C3A5',  // disabled状態
    400: '#87AF87',  // アイコン（非アクティブ）
    500: '#6B8E6B',  // リンク、セカンダリアクション（メインカラー）
    600: '#5A7A5A',  // プライマリCTA
    700: '#4A664A',  // ホバー・押下時
    800: '#3A523A',  // 強調テキスト
    900: '#2A3E2A',  // 見出し
    950: '#1A2A1A',  // 最も濃い
  },
  // アクセント（テラコッタ系）- 温もり、地に足がついた
  accent: {
    50: '#FDF5F0',   // 通知バッジ背景
    100: '#FBEADE',  // ハイライト
    200: '#F7D5BD',  // 軽いアクセント
    300: '#F0B896',  // バッジ
    400: '#E69B70',  // アイコンアクセント
    500: '#CD8B62',  // 強調（メインアクセントカラー）
    600: '#B87A54',  // セカンダリCTA
    700: '#9A6647',  // ホバー時
  },
  // ニュートラル（ナチュラルグレー系）- テキスト・ボーダー・背景
  neutral: {
    50: '#FDFCFB',   // カード背景（薄）、クリーム
    100: '#F8F6F4',  // セクション背景
    200: '#EBE7E4',  // ボーダー、区切り線
    300: '#D9D3CE',  // disabled状態
    400: '#AEA6A0',  // プレースホルダー
    500: '#7D756E',  // サブテキスト
    600: '#5C554F',  // 本文テキスト
    700: '#45403B',  // 強調テキスト
    800: '#2E2A27',  // 見出し
    900: '#1C1A18',  // 最も濃い
  },
  // 背景色
  background: '#FDFCFB',  // メイン背景（クリーム）
  surface: '#F8F6F4',     // カード背景（neutral-100）
  // 基本色
  white: '#FFFFFF',
  black: '#000000',
  // ステータスカラー（ナチュラルトーンに調整）
  success: {
    50: '#E8F5E8',
    500: '#5B9B5B',
    600: '#4A8A4A',
  },
  warning: {
    50: '#FEF5E7',
    500: '#D4A24A',
    600: '#C2902E',
  },
  error: {
    50: '#FDEDED',
    500: '#D35F5F',
    600: '#C24A4A',
  },
  info: {
    50: '#E8F2F8',
    500: '#5A8EB5',
    600: '#4A7DA3',
  },
  // マップマーカー用（視認性重視）
  marker: {
    recruitment: '#CD8B62',  // 募集（テラコッタ）
    wantToDo: '#6B8E6B',     // やりたいこと（セージグリーン）
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
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
}

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,   // 互換性のため維持
  xxxl: 32,  // 互換性のため維持
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
}

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
}

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

// デザインガイドライン v3 準拠のシャドウ（より繊細に）
export const shadows = {
  xs: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 12,
  },
  // 互換性のためのエイリアス
  subtle: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  soft: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
}

// 共通スタイルパターン
export const commonStyles = {
  // カード（ガイドライン v3 準拠）
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  // プライマリCTAボタン
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  // セカンダリボタン
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  secondaryButtonText: {
    color: colors.neutral[700],
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  // ゴーストボタン
  ghostButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ghostButtonText: {
    color: colors.primary[600],
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  // デストラクティブボタン（テラコッタ系）
  destructiveButton: {
    backgroundColor: colors.accent[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  destructiveButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  // 入力フィールド
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
    color: colors.neutral[800],
  },
  inputFocused: {
    borderColor: colors.primary[600],
  },
  // セクション背景
  sectionBackground: {
    backgroundColor: colors.neutral[100],
  },
  // テキストスタイル
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  body: {
    fontSize: fontSize.md,
    color: colors.neutral[600],
  },
  subtext: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  placeholder: {
    color: colors.neutral[400],
  },
  link: {
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
}

// アニメーション設定
export const animation = {
  duration: {
    fast: 150,
    default: 200,
    slow: 300,
  },
  easing: {
    default: 'ease-out',
    inOut: 'ease-in-out',
  },
}
