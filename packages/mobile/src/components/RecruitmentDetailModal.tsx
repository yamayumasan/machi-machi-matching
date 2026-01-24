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
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useAuthStore } from '@/stores/auth'
import { getApplications, updateApplicationStatus, Application } from '@/services/recruitment'
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
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null)

  useEffect(() => {
    if (visible && recruitmentId) {
      fetchRecruitment(recruitmentId)
    }
  }, [visible, recruitmentId])

  // 主催者の場合、応募一覧を取得
  useEffect(() => {
    const isCreator = recruitment?.isOwner ?? user?.id === recruitment?.creatorId
    if (visible && recruitmentId && isCreator) {
      fetchApplications()
    }
  }, [visible, recruitmentId, recruitment?.isOwner, recruitment?.creatorId, user?.id])

  const fetchApplications = async () => {
    if (!recruitmentId) return
    setIsLoadingApplications(true)
    try {
      const apps = await getApplications(recruitmentId)
      setApplications(apps)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoadingApplications(false)
    }
  }

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

  const handleApplicationAction = async (applicationId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!recruitmentId) return

    setProcessingApplicationId(applicationId)
    try {
      const result = await updateApplicationStatus(recruitmentId, applicationId, action)

      // 応募一覧を更新
      setApplications(prev => prev.map(app =>
        app.id === applicationId ? { ...app, status: action } : app
      ))

      // 募集を再取得（参加人数などが更新される）
      await fetchRecruitment(recruitmentId)

      if (action === 'APPROVED' && result.groupId) {
        Alert.alert('承認完了', 'グループが作成されました', [
          {
            text: 'グループを開く',
            onPress: () => {
              onClose()
              router.push(`/group/${result.groupId}`)
            },
          },
          { text: 'OK' },
        ])
      } else {
        Alert.alert(
          action === 'APPROVED' ? '承認しました' : '却下しました',
          action === 'APPROVED' ? '応募者に通知されます' : ''
        )
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message || '処理に失敗しました')
    } finally {
      setProcessingApplicationId(null)
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

  // 未処理の応募数
  const pendingApplications = applications.filter(app => app.status === 'PENDING')

  const handleClose = () => {
    setShowApplyForm(false)
    setApplyMessage('')
    setApplications([])
    onClose()
  }

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: '未対応', color: colors.warning[500], bg: colors.warning[50] }
      case 'APPROVED':
        return { text: '承認済', color: colors.accent[600], bg: colors.accent[50] }
      case 'REJECTED':
        return { text: '却下', color: colors.error[500], bg: colors.error[50] }
      default:
        return { text: status, color: colors.primary[500], bg: colors.primary[100] }
    }
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
                <MaterialCommunityIcons name="close" size={24} color={colors.primary[400]} />
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
                      <MaterialCommunityIcons name="calendar" size={18} color={colors.primary[500]} style={styles.detailIcon} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>日時</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(recruitment.datetime, recruitment.datetimeFlex)}
                        </Text>
                      </View>
                    </View>

                    {recruitment.landmarkName && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary[500]} style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>場所</Text>
                          <Text style={styles.detailValue}>{recruitment.landmarkName}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="account-group" size={18} color={colors.primary[500]} style={styles.detailIcon} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>参加人数</Text>
                        <Text style={styles.detailValue}>
                          {recruitment.currentPeople} / {recruitment.maxPeople}人
                          {recruitment.minPeople > 1 && ` (最少${recruitment.minPeople}人)`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="map" size={18} color={colors.primary[500]} style={styles.detailIcon} />
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

                  {/* 応募一覧（主催者のみ） */}
                  {isCreator && (
                    <View style={styles.applicationsCard}>
                      <View style={styles.applicationsHeader}>
                        <Text style={styles.applicationsTitle}>応募一覧</Text>
                        {pendingApplications.length > 0 && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{pendingApplications.length}件未対応</Text>
                          </View>
                        )}
                      </View>

                      {isLoadingApplications ? (
                        <ActivityIndicator color={colors.primary[400]} style={{ padding: spacing.md }} />
                      ) : applications.length === 0 ? (
                        <View style={styles.emptyApplications}>
                          <MaterialCommunityIcons name="inbox-outline" size={32} color={colors.primary[300]} />
                          <Text style={styles.emptyApplicationsText}>応募はまだありません</Text>
                        </View>
                      ) : (
                        <View style={styles.applicationsList}>
                          {applications.map((app) => {
                            const statusBadge = getApplicationStatusBadge(app.status)
                            const isProcessing = processingApplicationId === app.id
                            return (
                              <View key={app.id} style={styles.applicationItem}>
                                <View style={styles.applicationUserRow}>
                                  <View style={styles.applicationAvatar}>
                                    <Text style={styles.applicationAvatarText}>
                                      {app.applicant.nickname?.charAt(0) || '?'}
                                    </Text>
                                  </View>
                                  <View style={styles.applicationInfo}>
                                    <Text style={styles.applicationName}>{app.applicant.nickname}</Text>
                                    {app.message && (
                                      <Text style={styles.applicationMessage} numberOfLines={2}>
                                        {app.message}
                                      </Text>
                                    )}
                                  </View>
                                  <View style={[styles.applicationStatusBadge, { backgroundColor: statusBadge.bg }]}>
                                    <Text style={[styles.applicationStatusText, { color: statusBadge.color }]}>
                                      {statusBadge.text}
                                    </Text>
                                  </View>
                                </View>

                                {app.status === 'PENDING' && (
                                  <View style={styles.applicationActions}>
                                    <TouchableOpacity
                                      style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                                      onPress={() => handleApplicationAction(app.id, 'REJECTED')}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? (
                                        <ActivityIndicator size="small" color={colors.error[500]} />
                                      ) : (
                                        <>
                                          <MaterialCommunityIcons name="close" size={16} color={colors.error[500]} />
                                          <Text style={styles.rejectButtonText}>却下</Text>
                                        </>
                                      )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
                                      onPress={() => handleApplicationAction(app.id, 'APPROVED')}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? (
                                        <ActivityIndicator size="small" color={colors.white} />
                                      ) : (
                                        <>
                                          <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                                          <Text style={styles.approveButtonText}>承認</Text>
                                        </>
                                      )}
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            )
                          })}
                        </View>
                      )}
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
                        <MaterialCommunityIcons name="chat" size={20} color={colors.white} style={{ marginRight: spacing.xs }} />
                        <Text style={styles.groupButtonText}>グループチャットを開く</Text>
                      </TouchableOpacity>
                    ) : isCreator ? (
                      groupId ? (
                        <TouchableOpacity
                          style={styles.groupButton}
                          onPress={() => {
                            handleClose()
                            router.push(`/group/${groupId}`)
                          }}
                        >
                          <MaterialCommunityIcons name="chat" size={20} color={colors.white} style={{ marginRight: spacing.xs }} />
                          <Text style={styles.groupButtonText}>グループチャットを開く</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.creatorHint}>
                          <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary[500]} />
                          <Text style={styles.creatorHintText}>
                            応募を承認するとグループが作成されます
                          </Text>
                        </View>
                      )
                    ) : hasApplied ? (
                      <View style={styles.statusContainer}>
                        <MaterialCommunityIcons
                          name={
                            applicationStatus === 'PENDING' ? 'clock-outline' :
                            applicationStatus === 'APPROVED' ? 'check-circle' : 'close-circle'
                          }
                          size={20}
                          color={
                            applicationStatus === 'PENDING' ? colors.primary[500] :
                            applicationStatus === 'APPROVED' ? colors.accent[600] : colors.error[500]
                          }
                          style={{ marginRight: spacing.xs }}
                        />
                        <Text style={styles.appliedStatusText}>
                          {applicationStatus === 'PENDING'
                            ? '応募中 - 返答をお待ちください'
                            : applicationStatus === 'APPROVED'
                            ? '承認されました'
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
  categoryName: {
    fontSize: 12,
    color: colors.primary[700],
    marginLeft: 4,
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
  // 応募一覧スタイル
  applicationsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  applicationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  applicationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  pendingBadge: {
    backgroundColor: colors.warning[50],
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    color: colors.warning[500],
    fontWeight: '600',
  },
  emptyApplications: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyApplicationsText: {
    fontSize: 13,
    color: colors.primary[400],
    marginTop: spacing.sm,
  },
  applicationsList: {
    gap: spacing.sm,
  },
  applicationItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
  },
  applicationUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  applicationAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  applicationInfo: {
    flex: 1,
  },
  applicationName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[900],
  },
  applicationMessage: {
    fontSize: 12,
    color: colors.primary[500],
    marginTop: 2,
  },
  applicationStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  applicationStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    fontSize: 13,
    color: colors.error[500],
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent[600],
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
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
    flexDirection: 'row',
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  creatorHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  creatorHintText: {
    fontSize: 13,
    color: colors.primary[600],
    marginLeft: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
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
