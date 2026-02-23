/**
 * カスタムRefreshControl
 * デザインガイドライン v2 準拠のモダンなプルリフレッシュ演出
 */
import { useCallback } from 'react'
import { RefreshControl as RNRefreshControl, Platform } from 'react-native'
import { colors } from '@/constants/theme'
import { lightTap, successFeedback } from '@/utils/haptics'

interface CustomRefreshControlProps {
  refreshing: boolean
  onRefresh: () => void | Promise<void>
  tintColor?: string
  title?: string
  titleColor?: string
  /** ハプティックフィードバックを有効化 */
  hapticEnabled?: boolean
}

export function RefreshControl({
  refreshing,
  onRefresh,
  tintColor = colors.primary[600],
  title,
  titleColor = colors.neutral[500],
  hapticEnabled = true,
}: CustomRefreshControlProps) {
  const handleRefresh = useCallback(async () => {
    if (hapticEnabled) {
      lightTap()
    }

    const result = onRefresh()

    // Promiseの場合は完了を待って成功フィードバック
    if (result instanceof Promise) {
      try {
        await result
        if (hapticEnabled) {
          successFeedback()
        }
      } catch {
        // エラー時は何もしない（呼び出し元でハンドリング）
      }
    }
  }, [onRefresh, hapticEnabled])

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={tintColor}
      colors={[colors.primary[600], colors.accent[500]]} // Android用
      progressBackgroundColor={colors.white}
      {...(Platform.OS === 'ios' && title
        ? {
            title,
            titleColor,
          }
        : {})}
    />
  )
}
