import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NearbyItem } from '@/services/nearby'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from './CategoryIcon'

interface NearbyItemCardProps {
  item: NearbyItem
  onPress?: () => void
  onLongPress?: () => void
  isSelected?: boolean
  showDistance?: boolean
  compact?: boolean
}

export function NearbyItemCard({
  item,
  onPress,
  onLongPress,
  isSelected = false,
  showDistance = false,
  compact = false,
}: NearbyItemCardProps) {
  const isRecruitment = item.type === 'recruitment'

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
      <TouchableOpacity
        style={[styles.compactContainer, isSelected && styles.selected]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {/* カテゴリアイコン */}
        <View style={[
          styles.compactIcon,
          { backgroundColor: isRecruitment ? '#FFF3ED' : colors.accent[50] }
        ]}>
          <CategoryIcon
            name={item.category.icon}
            size={18}
            color={isRecruitment ? '#FF6B35' : colors.accent[600]}
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
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* ヘッダー: タイプバッジ + カテゴリ */}
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: isRecruitment ? '#FFF3ED' : colors.accent[50] }
          ]}>
            <Text style={[
              styles.typeBadgeText,
              { color: isRecruitment ? '#FF6B35' : colors.accent[600] }
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
      </View>

      {/* 参加中バッジ */}
      {isRecruitment && item.isParticipating && (
        <View style={styles.participatingBadge}>
          <Text style={styles.participatingText}>参加中</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  selected: {
    backgroundColor: colors.accent[50],
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
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    gap: 4,
  },
  categoryName: {
    fontSize: 11,
    color: colors.primary[700],
  },
  distanceBadge: {
    fontSize: 12,
    color: colors.primary[500],
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[900],
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
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  nickname: {
    fontSize: 13,
    color: colors.primary[600],
  },
  peopleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  peopleText: {
    fontSize: 13,
    color: colors.primary[500],
  },
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingText: {
    fontSize: 13,
    color: colors.primary[500],
  },
  participatingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent[100],
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
  },
  participatingText: {
    fontSize: 10,
    color: colors.accent[700],
    fontWeight: '600',
  },
  distance: {
    fontSize: 12,
    color: colors.primary[400],
    marginLeft: spacing.sm,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[900],
    marginBottom: 2,
  },
  compactMeta: {
    fontSize: 12,
    color: colors.primary[500],
  },
})
