import { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
  DimensionValue,
} from 'react-native'
import { colors, borderRadius, spacing } from '@/constants/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface SkeletonProps {
  width?: DimensionValue
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: customBorderRadius = borderRadius.md,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [shimmerAnim])

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  })

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: customBorderRadius,
          opacity,
        },
        style,
      ]}
    />
  )
}

// 円形スケルトン（アバター用）
interface SkeletonCircleProps {
  size?: number
  style?: ViewStyle
}

export function SkeletonCircle({ size = 40, style }: SkeletonCircleProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  )
}

// テキスト用スケルトン
interface SkeletonTextProps {
  lines?: number
  lineHeight?: number
  lastLineWidth?: DimensionValue
  style?: ViewStyle
}

export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={index < lines - 1 ? { marginBottom: spacing.sm } : undefined}
        />
      ))}
    </View>
  )
}

// カード型スケルトン（NearbyItemCard用）
interface SkeletonCardProps {
  compact?: boolean
  style?: ViewStyle
}

export function SkeletonCard({ compact = false, style }: SkeletonCardProps) {
  if (compact) {
    return (
      <View style={[styles.compactCard, style]}>
        <SkeletonCircle size={40} />
        <View style={styles.compactContent}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: spacing.xs }} />
        </View>
        <Skeleton width={50} height={28} borderRadius={borderRadius.lg} />
      </View>
    )
  }

  return (
    <View style={[styles.card, style]}>
      {/* バッジエリア */}
      <View style={styles.badgeArea}>
        <Skeleton width={60} height={22} borderRadius={borderRadius.full} />
        <Skeleton
          width={80}
          height={22}
          borderRadius={borderRadius.full}
          style={{ marginLeft: spacing.xs }}
        />
      </View>

      {/* タイトル */}
      <Skeleton width="85%" height={18} style={{ marginTop: spacing.sm }} />
      <Skeleton
        width="60%"
        height={18}
        style={{ marginTop: spacing.xs }}
      />

      {/* メタ情報 */}
      <View style={styles.metaArea}>
        <View style={styles.userArea}>
          <SkeletonCircle size={24} />
          <Skeleton width={60} height={14} style={{ marginLeft: spacing.xs }} />
        </View>
        <Skeleton width={60} height={32} borderRadius={borderRadius.lg} />
      </View>
    </View>
  )
}

// リストスケルトン
interface SkeletonListProps {
  count?: number
  compact?: boolean
  style?: ViewStyle
}

export function SkeletonList({ count = 5, compact = false, style }: SkeletonListProps) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          compact={compact}
          style={compact ? undefined : { marginBottom: spacing.sm }}
        />
      ))}
    </View>
  )
}

// プロフィールスケルトン
export function SkeletonProfile({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.profileContainer, style]}>
      <SkeletonCircle size={80} style={{ alignSelf: 'center' }} />
      <Skeleton
        width={120}
        height={20}
        style={{ alignSelf: 'center', marginTop: spacing.md }}
      />
      <Skeleton
        width="80%"
        height={14}
        style={{ alignSelf: 'center', marginTop: spacing.sm }}
      />
      <View style={styles.statsArea}>
        <View style={styles.statItem}>
          <Skeleton width={40} height={24} />
          <Skeleton width={50} height={12} style={{ marginTop: spacing.xs }} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={40} height={24} />
          <Skeleton width={50} height={12} style={{ marginTop: spacing.xs }} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={40} height={24} />
          <Skeleton width={50} height={12} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.neutral[200],
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  compactContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  badgeArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  userArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    padding: spacing.lg,
  },
  statsArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  statItem: {
    alignItems: 'center',
  },
})
