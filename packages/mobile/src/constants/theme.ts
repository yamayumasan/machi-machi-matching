// デザインガイドライン v2 準拠 - モダン＆ミニマル（インディゴ × コーラル）
export const colors = {
  // プライマリ（インディゴ系）- 信頼感と落ち着き
  primary: {
    50: '#EEF2FF',   // セクション背景、軽いハイライト
    100: '#E0E7FF',  // カード背景、ホバー
    200: '#C7D2FE',  // ボーダー、区切り線
    300: '#A5B4FC',  // disabled状態
    400: '#818CF8',  // アイコン（非アクティブ）
    500: '#6366F1',  // リンク、セカンダリアクション
    600: '#4F46E5',  // プライマリCTA
    700: '#4338CA',  // ホバー・押下時
    800: '#3730A3',  // 強調テキスト
    900: '#312E81',  // 見出し
    950: '#1E1B4B',  // 最も濃い
  },
  // アクセント（コーラル系）- 温かみと活力
  accent: {
    50: '#FFF5F5',   // 通知バッジ背景
    100: '#FFE4E4',  // ハイライト
    200: '#FECACA',  // 軽いアクセント
    300: '#FDA4A4',  // バッジ
    400: '#F87171',  // アイコンアクセント
    500: '#EF4444',  // 強調
    600: '#DC2626',  // セカンダリCTA
    700: '#B91C1C',  // ホバー時
  },
  // ニュートラル（スレートグレー系）- テキスト・ボーダー・背景
  neutral: {
    50: '#F8FAFC',   // カード背景（薄）
    100: '#F1F5F9',  // セクション背景
    200: '#E2E8F0',  // ボーダー、区切り線
    300: '#CBD5E1',  // disabled状態
    400: '#94A3B8',  // プレースホルダー
    500: '#64748B',  // サブテキスト
    600: '#475569',  // 本文テキスト
    700: '#334155',  // 強調テキスト
    800: '#1E293B',  // 見出し
    900: '#0F172A',  // 最も濃い
  },
  // 背景色
  background: '#FFFFFF',    // メイン背景（ピュアホワイト）
  surface: '#F8FAFC',       // カード背景（neutral-50）
  // 基本色
  white: '#FFFFFF',
  black: '#000000',
  // ステータスカラー
  success: {
    50: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
  },
  warning: {
    50: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  error: {
    50: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },
  info: {
    50: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
  },
  // マップマーカー用（視認性重視）
  marker: {
    recruitment: '#EF4444',  // 募集（コーラル）
    wantToDo: '#4F46E5',     // やりたいこと（インディゴ）
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

// デザインガイドライン v2 準拠のシャドウ
export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 48,
    elevation: 12,
  },
  // 互換性のためのエイリアス
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
}

// 共通スタイルパターン
export const commonStyles = {
  // カード（ガイドライン v2 準拠）
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
  // デストラクティブボタン
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
