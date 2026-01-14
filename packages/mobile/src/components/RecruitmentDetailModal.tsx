import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from './CategoryIcon'

interface RecruitmentDetailModalProps {
  visible: boolean
  recruitmentId: string | null
  onClose: () => void
}

export function RecruitmentDetailModal({
  visible,
  recruitmentId,
  onClose,
}: RecruitmentDetailModalProps) {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const {
    selectedRecruitment: recruitment,
    isLoading,
    fetchRecruitment,
    apply,
  } = useRecruitmentStore()

  const [showApplyForm, setShowApplyForm] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (visible && recruitmentId) {
      fetchRecruitment(recruitmentId)
    }
  }, [visible, recruitmentId])

  const handleApply = async () => {
    if (!recruitmentId) return

    setIsApplying(true)
    try {
      await apply(recruitmentId, applyMessage || undefined)
      setShowApplyForm(false)
      setApplyMessage('')
      Alert.alert('応募完了', '募集への応募が完了しました。')
      onClose()
    } catch (error: any) {
      Alert.alert('エラー', error.message || '応募に失敗しました')
    } finally {
      setIsApplying(false)
    }
  }

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
    return datetimeFlex || '日程未定'
  }

  const isCreator = recruitment?.isOwner ?? user?.id === recruitment?.creatorId
  const isFull = recruitment ? recruitment.currentPeople >= recruitment.maxPeople : false
  const isClosed = recruitment?.status !== 'OPEN'
  const isParticipating = recruitment?.isParticipating
  const hasApplied = recruitment?.hasApplied
  const applicationStatus = recruitment?.applicationStatus
  const groupId = recruitment?.groupId

  const handleClose = () => {
    setShowApplyForm(false)
    setApplyMessage('')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* ヘッダー */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            {isLoading || !recruitment ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary[500]} size="large" />
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  {/* カテゴリ・ステータス */}
                  <View style={styles.badges}>
                    <View style={styles.categoryBadge}>
                      <CategoryIcon name={recruitment.category.icon} size={14} color={colors.primary[700]} />
                      <Text style={styles.categoryName}>{recruitment.category.name}</Text>
                    </View>
                    {recruitment.status !== 'OPEN' && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          {recruitment.status === 'CLOSED' ? '締め切り' : '完了'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* タイトル */}
                  <Text style={styles.title}>{recruitment.title}</Text>

                  {/* 主催者 */}
                  <View style={styles.creatorCard}>
                    {recruitment.creator.avatarUrl ? (
                      <Image
                        source={{ uri: recruitment.creator.avatarUrl }}
                        style={styles.creatorAvatar}
                      />
                    ) : (
                      <View style={styles.creatorAvatarPlaceholder}>
                        <Text style={styles.creatorAvatarText}>
                          {recruitment.creator.nickname?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.creatorInfo}>
                      <Text style={styles.creatorLabel}>主催者</Text>
                      <Text style={styles.creatorName}>
                        {recruitment.creator.nickname || '不明'}
                      </Text>
                    </View>
                  </View>

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

                    {recruitment.landmarkName && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>場所</Text>
                          <Text style={styles.detailValue}>{recruitment.landmarkName}</Text>
                        </View>
                      </View>
                    )}

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

                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>🌏</Text>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>エリア</Text>
                        <Text style={styles.detailValue}>
                          {recruitment.area === 'TOKYO' ? '東京' : '仙台'}
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
                                {member.nickname?.charAt(0) || '?'}
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

                  <View style={{ height: 100 }} />
                </ScrollView>

                {/* 応募フォーム */}
                {showApplyForm && (
                  <View style={styles.applyForm}>
                    <Text style={styles.applyFormTitle}>応募メッセージ（任意）</Text>
                    <TextInput
                      style={styles.applyInput}
                      placeholder="一言メッセージを添える..."
                      value={applyMessage}
                      onChangeText={setApplyMessage}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.applyFormButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowApplyForm(false)}
                      >
                        <Text style={styles.cancelButtonText}>キャンセル</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.submitApplyButton, isApplying && styles.buttonDisabled]}
                        onPress={handleApply}
                        disabled={isApplying}
                      >
                        <Text style={styles.submitApplyButtonText}>
                          {isApplying ? '送信中...' : '応募する'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* フッター */}
                {!showApplyForm && (
                  <View style={styles.footer}>
                    {isParticipating && groupId ? (
                      <TouchableOpacity
                        style={styles.groupButton}
                        onPress={() => {
                          handleClose()
                          router.push(`/group/${groupId}`)
                        }}
                      >
                        <Text style={styles.groupButtonText}>グループチャットを開く</Text>
                      </TouchableOpacity>
                    ) : isCreator ? (
                      <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => {
                          handleClose()
                          router.push(`/recruitment/${recruitmentId}/applications`)
                        }}
                      >
                        <Text style={styles.manageButtonText}>応募を確認</Text>
                      </TouchableOpacity>
                    ) : hasApplied ? (
                      <View style={styles.statusContainer}>
                        <Text style={styles.appliedStatusText}>
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
                      <TouchableOpacity
                        style={[
                          styles.applyButton,
                          (isClosed || isFull) && styles.buttonDisabled,
                        ]}
                        onPress={() => setShowApplyForm(true)}
                        disabled={isClosed || isFull}
                      >
                        <Text style={styles.applyButtonText}>
                          {isClosed ? '締め切り済み' : isFull ? '定員に達しました' : '応募する'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    color: colors.primary[700],
  },
  statusBadge: {
    backgroundColor: colors.primary[200],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.primary[600],
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary[900],
    marginBottom: spacing.md,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  creatorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  creatorAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[600],
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
  },
  detailsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: colors.primary[900],
  },
  descriptionCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.primary[800],
    lineHeight: 22,
  },
  membersCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  membersList: {
    gap: spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  memberName: {
    fontSize: 14,
    color: colors.primary[800],
    flex: 1,
  },
  ownerBadge: {
    backgroundColor: colors.accent[100],
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: colors.accent[700],
    fontWeight: '600',
  },
  applyForm: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  applyFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  applyInput: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  applyFormButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
  },
  submitApplyButton: {
    flex: 2,
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitApplyButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  groupButton: {
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  groupButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: colors.primary[900],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  appliedStatusText: {
    fontSize: 14,
    color: colors.primary[700],
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
})
