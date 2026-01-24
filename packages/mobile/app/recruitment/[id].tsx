import { useEffect, useState, useCallback } from 'react'
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
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Application, getApplications, updateApplicationStatus } from '@/services/recruitment'

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

  // 応募一覧用の状態
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchRecruitment(id)
    }
  }, [id])

  // 主催者の場合、応募一覧を取得
  const fetchApplications = useCallback(async () => {
    if (!id) return
    setIsLoadingApplications(true)
    try {
      const data = await getApplications(id)
      setApplications(data)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoadingApplications(false)
    }
  }, [id])

  // 主催者の場合、募集データ取得後に応募一覧を取得
  useEffect(() => {
    const isOwner = recruitment?.isOwner ?? user?.id === recruitment?.creatorId
    if (isOwner && recruitment) {
      fetchApplications()
    }
  }, [recruitment, user?.id, fetchApplications])

  // 応募の承認/拒否
  const handleApplicationAction = async (applicationId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!id) return
    setProcessingApplicationId(applicationId)
    try {
      const result = await updateApplicationStatus(id, applicationId, action)
      // 応募一覧を再取得
      await fetchApplications()
      // 募集情報も再取得（人数が変わる可能性）
      await fetchRecruitment(id)

      if (action === 'APPROVED' && result.groupId) {
        Alert.alert(
          '承認完了',
          'グループチャットが作成されました',
          [
            { text: 'あとで', style: 'cancel' },
            { text: 'チャットを開く', onPress: () => router.push(`/group/${result.groupId}`) }
          ]
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
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.primary[400]} />
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
          headerRight: isCreator && recruitment.status === 'OPEN' ? () => (
            <TouchableOpacity
              onPress={() => router.push(`/recruitment/${id}/edit`)}
              style={styles.headerEditButton}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          ) : undefined,
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
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>日時</Text>
              <Text style={styles.detailValue}>
                {formatDate(recruitment.datetime, recruitment.datetimeFlex)}
              </Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary[500]} />
            </View>
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
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.primary[500]} />
            </View>
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

        {/* 応募一覧（主催者のみ表示） */}
        {isCreator && (
          <View style={styles.applicationsCard}>
            <View style={styles.applicationsTitleRow}>
              <Text style={styles.applicationsTitle}>応募一覧</Text>
              {applications.filter(a => a.status === 'PENDING').length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>
                    {applications.filter(a => a.status === 'PENDING').length}件
                  </Text>
                </View>
              )}
            </View>

            {isLoadingApplications ? (
              <ActivityIndicator color={colors.primary[500]} style={{ marginVertical: spacing.md }} />
            ) : applications.length === 0 ? (
              <Text style={styles.noApplicationsText}>まだ応募がありません</Text>
            ) : (
              <View style={styles.applicationsList}>
                {applications.map((application) => (
                  <View key={application.id} style={styles.applicationItem}>
                    <View style={styles.applicationHeader}>
                      <View style={styles.applicantAvatar}>
                        <Text style={styles.applicantAvatarText}>
                          {application.applicant.nickname.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.applicantInfo}>
                        <Text style={styles.applicantName}>{application.applicant.nickname}</Text>
                        <Text style={styles.applicationDate}>
                          {new Date(application.createdAt).toLocaleDateString('ja-JP')}
                        </Text>
                      </View>
                      {application.status !== 'PENDING' && (
                        <View style={[
                          styles.applicationStatusBadge,
                          application.status === 'APPROVED' && styles.approvedBadge,
                          application.status === 'REJECTED' && styles.rejectedBadge,
                        ]}>
                          <Text style={[
                            styles.applicationStatusText,
                            application.status === 'APPROVED' && styles.approvedText,
                            application.status === 'REJECTED' && styles.rejectedText,
                          ]}>
                            {application.status === 'APPROVED' ? '承認済み' : '拒否'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {application.message && (
                      <Text style={styles.applicationMessage}>{application.message}</Text>
                    )}

                    {application.status === 'PENDING' && (
                      <View style={styles.applicationActions}>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleApplicationAction(application.id, 'REJECTED')}
                          disabled={processingApplicationId === application.id}
                        >
                          {processingApplicationId === application.id ? (
                            <ActivityIndicator size="small" color={colors.primary[500]} />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="close" size={16} color={colors.primary[600]} />
                              <Text style={styles.rejectButtonText}>拒否</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApplicationAction(application.id, 'APPROVED')}
                          disabled={processingApplicationId === application.id}
                        >
                          {processingApplicationId === application.id ? (
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
                ))}
              </View>
            )}
          </View>
        )}

        {/* 下部余白 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* フッターボタン（主催者でグループがない場合は非表示） */}
      {!(isCreator && !groupId) && (
        <View style={styles.footer}>
          {/* 参加中の場合: グループチャットへ */}
          {isParticipating && groupId ? (
            <TouchableOpacity
              style={styles.groupButton}
              onPress={() => router.push(`/group/${groupId}`)}
            >
              <Text style={styles.groupButtonText}>グループチャットを開く</Text>
            </TouchableOpacity>
          ) : isCreator && groupId ? (
            /* 主催者でグループがある場合: チャットへ */
            <TouchableOpacity
              style={styles.groupButton}
              onPress={() => router.push(`/group/${groupId}`)}
            >
              <Text style={styles.groupButtonText}>グループチャットを開く</Text>
            </TouchableOpacity>
          ) : hasApplied ? (
            /* 応募済みの場合 */
            <View style={styles.statusContainer}>
              <View style={styles.footerStatusWithIcon}>
                {applicationStatus === 'PENDING' && (
                  <MaterialCommunityIcons name="email-outline" size={18} color={colors.primary[600]} />
                )}
                {applicationStatus === 'APPROVED' && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.accent[600]} />
                )}
                {applicationStatus === 'REJECTED' && (
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.primary[400]} />
                )}
                <Text style={styles.footerStatusText}>
                  {applicationStatus === 'PENDING'
                    ? '応募中 - 返答をお待ちください'
                    : applicationStatus === 'APPROVED'
                    ? '承認されました'
                    : applicationStatus === 'REJECTED'
                    ? '応募は承認されませんでした'
                    : '応募済み'}
                </Text>
              </View>
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
      )}

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
                <MaterialCommunityIcons name="close" size={24} color={colors.primary[400]} />
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
              placeholderTextColor={colors.primary[400]}
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
    backgroundColor: colors.primary[50],
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
    color: colors.primary[500],
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
    color: colors.primary[700],
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
    color: colors.primary[900],
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
    color: colors.primary[500],
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
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
    color: colors.primary[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: colors.primary[900],
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.primary[100],
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
    color: colors.primary[900],
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.primary[700],
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
    borderTopColor: colors.primary[200],
  },
  applyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: colors.primary[300],
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
    color: colors.primary[900],
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
    backgroundColor: colors.primary[50],
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
    color: colors.primary[700],
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
    backgroundColor: colors.primary[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerStatusText: {
    fontSize: 14,
    color: colors.primary[700],
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
    color: colors.primary[900],
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.primary[400],
  },
  modalLabel: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.primary[300],
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
  // Detail icon container
  detailIconContainer: {
    width: 24,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  // Footer status with icon
  footerStatusWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  // Applications styles
  applicationsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  applicationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  applicationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[900],
  },
  pendingBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.accent[100],
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent[700],
  },
  noApplicationsText: {
    fontSize: 14,
    color: colors.primary[400],
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  applicationsList: {
    gap: spacing.md,
  },
  applicationItem: {
    backgroundColor: colors.primary[50],
    borderRadius: 10,
    padding: spacing.md,
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  applicantAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[800],
  },
  applicationDate: {
    fontSize: 12,
    color: colors.primary[500],
  },
  applicationStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  approvedBadge: {
    backgroundColor: colors.accent[100],
  },
  rejectedBadge: {
    backgroundColor: colors.primary[100],
  },
  applicationStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  approvedText: {
    color: colors.accent[700],
  },
  rejectedText: {
    color: colors.primary[500],
  },
  applicationMessage: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.primary[600],
    lineHeight: 18,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[200],
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
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
    fontWeight: '600',
    color: colors.white,
  },
  headerEditButton: {
    padding: spacing.sm,
  },
})
