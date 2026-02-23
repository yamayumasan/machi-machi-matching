import { useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NearbyItem } from '@/services/nearby'
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/constants/theme'
import { CategoryIcon } from './CategoryIcon'

interface NearbyItemCardProps {
  item: NearbyItem
  onPress?: () => void
  onLongPress?: () => void
  onDetailPress?: () => void
  isSelected?: boolean
  showDistance?: boolean
  compact?: boolean
}

export function NearbyItemCard({
  item,
  onPress,
  onLongPress,
  onDetailPress,
  isSelected = false,
  showDistance = false,
  compact = false,
}: NearbyItemCardProps) {
  const isRecruitment = item.type === 'recruitment'

  // タップアニメーション
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 10,
      tension: 100,
    }).start()
  }, [scaleAnim])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 10,
      tension: 100,
    }).start()
  }, [scaleAnim])

  // 距離をフォーマット
  const formatDistance = (meters?: number) => {
    if (!meters) return null
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  // ユーザー情報を取得
  const getUserInfo = () => {
    if (isRecruitment) {
      return {
        nickname: item.creator?.nickname || '不明',
        avatarUrl: item.creator?.avatarUrl,
      }
    }
    return {
      nickname: item.user?.nickname || '不明',
      avatarUrl: item.user?.avatarUrl,
    }
  }

  const userInfo = getUserInfo()

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[styles.compactContainer, isSelected && styles.selected]}
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
        {/* カテゴリアイコン */}
        <View style={[
          styles.compactIcon,
          { backgroundColor: isRecruitment ? colors.warning[50] : colors.primary[50] }
        ]}>
          <CategoryIcon
            name={item.category.icon}
            size={18}
            color={isRecruitment ? colors.marker.recruitment : colors.marker.wantToDo}
          />
        </View>

        {/* 情報 */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {isRecruitment ? item.title : `${item.category.name}で誘われ待ち中`}
          </Text>
          <Text style={styles.compactMeta}>
            {userInfo.nickname}
            {isRecruitment && item.currentPeople !== undefined && (
              <Text> · {item.currentPeople}/{item.maxPeople}人</Text>
            )}
          </Text>
        </View>

        {/* 距離 */}
        {showDistance && item.distance && (
          <Text style={styles.distance}>{formatDistance(item.distance)}</Text>
        )}

        {/* 詳細ボタン */}
        {onDetailPress && (
          <Pressable
            style={styles.detailButton}
            onPress={onDetailPress}
          >
            <Text style={styles.detailButtonText}>詳細</Text>
          </Pressable>
        )}
      </Pressable>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
    <Pressable
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* ヘッダー: タイプバッジ + カテゴリ */}
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: isRecruitment ? colors.warning[50] : colors.primary[50] }
          ]}>
            <Text style={[
              styles.typeBadgeText,
              { color: isRecruitment ? colors.marker.recruitment : colors.marker.wantToDo }
            ]}>
              {isRecruitment ? '募集' : '誘われ待ち'}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <CategoryIcon name={item.category.icon} size={12} color={colors.primary[700]} />
            <Text style={styles.categoryName}>{item.category.name}</Text>
          </View>
        </View>
        {showDistance && item.distance && (
          <Text style={styles.distanceBadge}>{formatDistance(item.distance)}</Text>
        )}
      </View>

      {/* タイトル */}
      <Text style={styles.title} numberOfLines={2}>
        {isRecruitment ? item.title : `${item.category.name}で誘われ待ち中`}
      </Text>

      {/* メタ情報 */}
      <View style={styles.meta}>
        {/* ユーザー情報 */}
        <View style={styles.userInfo}>
          {userInfo.avatarUrl ? (
            <Image source={{ uri: userInfo.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userInfo.nickname.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.nickname}>{userInfo.nickname}</Text>
        </View>

        {/* 募集の場合は人数も表示 */}
        {isRecruitment && item.currentPeople !== undefined && (
          <View style={styles.peopleInfo}>
            <MaterialCommunityIcons name="account-group" size={14} color={colors.primary[500]} />
            <Text style={styles.peopleText}>
              {item.currentPeople}/{item.maxPeople}人
            </Text>
          </View>
        )}

        {/* やりたいことの場合はタイミング表示 */}
        {!isRecruitment && item.timing && (
          <View style={styles.timingInfo}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary[500]} />
            <Text style={styles.timingText}>{item.timing}</Text>
          </View>
        )}

        {/* 詳細ボタン */}
        {onDetailPress && (
          <Pressable
            style={styles.detailButtonNormal}
            onPress={onDetailPress}
          >
            <Text style={styles.detailButtonText}>詳細</Text>
          </Pressable>
        )}
      </View>

      {/* 参加中バッジ */}
      {isRecruitment && item.isParticipating && (
        <View style={styles.participatingBadge}>
          <Text style={styles.participatingText}>参加中</Text>
        </View>
      )}
    </Pressable>
    </Animated.View>
  )
}

// デザインガイドライン v2 準拠のスタイル
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  selected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  categoryName: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    fontWeight: fontWeight.medium,
  },
  distanceBadge: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  avatarText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  nickname: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  peopleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  peopleText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  participatingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success[50],
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  participatingText: {
    fontSize: fontSize.xs - 1,
    color: colors.success[600],
    fontWeight: fontWeight.semibold,
  },
  distance: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    marginLeft: spacing.sm,
  },

  // Compact styles - モダンデザイン
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral[800],
    marginBottom: 2,
  },
  compactMeta: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },

  // Detail button styles - モダンデザイン
  detailButton: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary[600],
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  detailButtonNormal: {
    marginLeft: 'auto',
    backgroundColor: colors.primary[600],
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  detailButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
})
