import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'

export default function RecruitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const {
    selectedRecruitment: recruitment,
    isLoading,
    error,
    fetchRecruitment,
    apply,
  } = useRecruitmentStore()

  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (id) {
      fetchRecruitment(id)
    }
  }, [id])

  const formatDate = (datetime: string | null, datetimeFlex: string | null) => {
    if (datetime) {
      const date = new Date(datetime)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (datetimeFlex) {
      return datetimeFlex
    }
    return '日程未定'
  }

  const handleApply = async () => {
    if (!id) return

    setIsApplying(true)
    try {
      await apply(id, applyMessage || undefined)
      setIsApplyModalVisible(false)
      setApplyMessage('')
      Alert.alert('応募完了', '募集への応募が完了しました。主催者からの返答をお待ちください。')
    } catch (error: any) {
      Alert.alert('エラー', error.message || '応募に失敗しました')
    } finally {
      setIsApplying(false)
    }
  }

  const isCreator = recruitment?.isOwner ?? user?.id === recruitment?.creatorId
  const isFull = recruitment && recruitment.currentPeople >= recruitment.maxPeople
  const isClosed = recruitment?.status !== 'OPEN'
  const isParticipating = recruitment?.isParticipating
  const hasApplied = recruitment?.hasApplied
  const applicationStatus = recruitment?.applicationStatus
  const groupId = recruitment?.groupId

  if (isLoading || !recruitment) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: '募集詳細',
            headerBackTitle: '戻る',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: '募集詳細',
            headerBackTitle: '戻る',
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => id && fetchRecruitment(id)}
          >
            <Text style={styles.retryButtonText}>再読み込み</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '募集詳細',
          headerBackTitle: '戻る',
        }}
      />
      <ScrollView style={styles.scrollView}>
        {/* ヘッダー情報 */}
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <CategoryIcon name={recruitment.category.icon} size={14} color={colors.primary[700]} />
            <Text style={styles.categoryName}>{recruitment.category.name}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {recruitment.status === 'OPEN'
                ? '募集中'
                : recruitment.status === 'CLOSED'
                ? '締切'
                : recruitment.status === 'COMPLETED'
                ? '完了'
                : 'キャンセル'}
            </Text>
          </View>
        </View>

        {/* タイトル */}
        <Text style={styles.title}>{recruitment.title}</Text>

        {/* 主催者情報 */}
        <TouchableOpacity style={styles.creatorCard}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>
              {recruitment.creator.nickname.charAt(0)}
            </Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorLabel}>主催者</Text>
            <Text style={styles.creatorName}>{recruitment.creator.nickname}</Text>
          </View>
        </TouchableOpacity>

        {/* 詳細情報 */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>日時</Text>
              <Text style={styles.detailValue}>
                {formatDate(recruitment.datetime, recruitment.datetimeFlex)}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>場所</Text>
              <Text style={styles.detailValue}>
                {recruitment.landmarkName ||
                  (recruitment.area === 'TOKYO' ? '東京エリア' : '仙台エリア')}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>参加人数</Text>
              <Text style={styles.detailValue}>
                {recruitment.currentPeople} / {recruitment.maxPeople}人
                {recruitment.minPeople > 1 && ` (最少${recruitment.minPeople}人)`}
              </Text>
            </View>
          </View>
        </View>

        {/* 説明 */}
        {recruitment.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>詳細</Text>
            <Text style={styles.descriptionText}>{recruitment.description}</Text>
          </View>
        )}

        {/* 参加メンバー */}
        {recruitment.members && recruitment.members.length > 0 && (
          <View style={styles.membersCard}>
            <Text style={styles.membersTitle}>参加者</Text>
            <View style={styles.membersList}>
              {recruitment.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.nickname.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{member.nickname}</Text>
                  {member.role === 'OWNER' && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>主催</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 下部余白 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* フッターボタン */}
      <View style={styles.footer}>
        {/* 参加中の場合: グループチャットへ */}
        {isParticipating && groupId ? (
          <TouchableOpacity
            style={styles.groupButton}
            onPress={() => router.push(`/group/${groupId}`)}
          >
            <Text style={styles.groupButtonText}>グループチャットを開く</Text>
          </TouchableOpacity>
        ) : isCreator ? (
          /* 主催者の場合: 応募確認/編集 */
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.applicationsButton}
              onPress={() => router.push(`/recruitment/${id}/applications`)}
            >
              <Text style={styles.applicationsButtonText}>応募を確認</Text>
            </TouchableOpacity>
          </View>
        ) : hasApplied ? (
          /* 応募済みの場合 */
          <View style={styles.statusContainer}>
            <Text style={styles.footerStatusText}>
              {applicationStatus === 'PENDING'
                ? '📩 応募中 - 返答をお待ちください'
                : applicationStatus === 'APPROVED'
                ? '✅ 承認されました'
                : applicationStatus === 'REJECTED'
                ? '応募は承認されませんでした'
                : '応募済み'}
            </Text>
          </View>
        ) : (
          /* 未応募の場合 */
          <TouchableOpacity
            style={[
              styles.applyButton,
              (isFull || isClosed) && styles.applyButtonDisabled,
            ]}
            onPress={() => setIsApplyModalVisible(true)}
            disabled={isFull || isClosed}
          >
            <Text style={styles.applyButtonText}>
              {isClosed
                ? '募集は終了しました'
                : isFull
                ? '定員に達しました'
                : 'この募集に応募する'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 応募モーダル */}
      <Modal
        visible={isApplyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>応募する</Text>
              <TouchableOpacity
                onPress={() => setIsApplyModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              主催者へのメッセージ（任意）
            </Text>
            <TextInput
              style={styles.messageInput}
              value={applyMessage}
              onChangeText={setApplyMessage}
              placeholder="自己紹介やひとことメッセージを書いてみましょう"
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, isApplying && styles.submitButtonDisabled]}
              onPress={handleApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>応募を送信</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: 0,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: colors.primary[100],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  creatorAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: colors.gray[900],
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.sm,
  },
  descriptionCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  applyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  membersCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  memberName: {
    fontSize: 13,
    color: colors.gray[700],
  },
  ownerBadge: {
    marginLeft: 6,
    backgroundColor: colors.primary[100],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: '600',
  },
  groupButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  groupButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  applicationsButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applicationsButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: colors.gray[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerStatusText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.gray[400],
  },
  modalLabel: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
