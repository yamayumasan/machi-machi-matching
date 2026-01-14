import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NearbyWantToDo } from '@/services/nearby'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from './CategoryIcon'

const TIMING_LABELS: Record<string, string> = {
  THIS_WEEK: '今週',
  NEXT_WEEK: '来週',
  THIS_MONTH: '今月中',
  ANYTIME: 'いつでも',
}

interface WantToDoDetailModalProps {
  visible: boolean
  wantToDo: NearbyWantToDo | null
  onClose: () => void
}

export function WantToDoDetailModal({
  visible,
  wantToDo,
  onClose,
}: WantToDoDetailModalProps) {
  const insets = useSafeAreaInsets()
  const [isContacting, setIsContacting] = useState(false)

  if (!wantToDo) return null

  const handleContact = async () => {
    // TODO: 連絡機能の実装（チャットや募集作成への誘導）
    Alert.alert(
      '連絡する',
      `${wantToDo.user?.nickname || '不明'}さんに連絡しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '募集を作成して誘う',
          onPress: () => {
            onClose()
            // router.push('/recruitment/create') // 必要に応じて
          },
        },
      ]
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* コンテンツ */}
          <View style={styles.content}>
            {/* カテゴリアイコン */}
            <View style={styles.iconContainer}>
              <CategoryIcon name={wantToDo.category.icon} size={40} color={colors.accent[600]} />
            </View>

            {/* カテゴリ名 */}
            <Text style={styles.categoryName}>{wantToDo.category.name}</Text>
            <Text style={styles.subtitle}>で誘われ待ち中</Text>

            {/* ユーザー情報 */}
            <View style={styles.userCard}>
              {wantToDo.user?.avatarUrl ? (
                <Image
                  source={{ uri: wantToDo.user.avatarUrl }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>
                    {wantToDo.user?.nickname?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {wantToDo.user?.nickname || '不明'}
                </Text>
                {wantToDo.user?.area && (
                  <Text style={styles.userArea}>
                    {wantToDo.user.area === 'TOKYO' ? '東京' : '仙台'}エリア
                  </Text>
                )}
              </View>
            </View>

            {/* タイミング */}
            <View style={styles.timingCard}>
              <Text style={styles.timingLabel}>希望タイミング</Text>
              <View style={styles.timingBadge}>
                <Text style={styles.timingIcon}>⏰</Text>
                <Text style={styles.timingText}>
                  {TIMING_LABELS[wantToDo.timing] || wantToDo.timing}
                </Text>
              </View>
            </View>

            {/* コメント */}
            {wantToDo.comment && (
              <View style={styles.commentCard}>
                <Text style={styles.commentLabel}>コメント</Text>
                <Text style={styles.commentText}>{wantToDo.comment}</Text>
              </View>
            )}
          </View>

          {/* フッター */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.contactButton, isContacting && styles.buttonDisabled]}
              onPress={handleContact}
              disabled={isContacting}
            >
              <Text style={styles.contactButtonText}>
                この人を誘う
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.primary[300],
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm,
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 24,
    color: colors.primary[400],
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIconLarge: {
    fontSize: 40,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[900],
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary[500],
    marginBottom: spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
    marginBottom: spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[600],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
  },
  userArea: {
    fontSize: 13,
    color: colors.primary[500],
    marginTop: 2,
  },
  timingCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
    marginBottom: spacing.md,
  },
  timingLabel: {
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  timingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
  },
  commentCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
  },
  commentLabel: {
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },
  commentText: {
    fontSize: 14,
    color: colors.primary[800],
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  contactButton: {
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
})
