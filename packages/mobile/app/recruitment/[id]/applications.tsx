import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { getApplications, updateApplicationStatus, Application } from '@/services/recruitment'
import { colors, spacing } from '@/constants/theme'

export default function ApplicationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadApplications()
    }
  }, [id])

  const loadApplications = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await getApplications(id)
      setApplications(data)
    } catch (error: any) {
      Alert.alert('エラー', error.message || '応募の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (applicationId: string, action: 'APPROVE' | 'REJECT') => {
    if (!id) return

    Alert.alert(
      action === 'APPROVE' ? '応募を承認' : '応募を却下',
      action === 'APPROVE'
        ? 'この応募を承認しますか？承認するとグループチャットが作成されます。'
        : 'この応募を却下しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: action === 'APPROVE' ? '承認する' : '却下する',
          style: action === 'REJECT' ? 'destructive' : 'default',
          onPress: async () => {
            setProcessingId(applicationId)
            try {
              await updateApplicationStatus(id, applicationId, action === 'APPROVE' ? 'APPROVED' : 'REJECTED')
              // 応募一覧を更新
              setApplications((prev) =>
                prev.map((app) =>
                  app.id === applicationId
                    ? { ...app, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
                    : app
                )
              )
              Alert.alert(
                '完了',
                action === 'APPROVE'
                  ? '応募を承認しました。グループチャットが作成されました。'
                  : '応募を却下しました。'
              )
            } catch (error: any) {
              Alert.alert('エラー', error.message || '処理に失敗しました')
            } finally {
              setProcessingId(null)
            }
          },
        },
      ]
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const renderApplication = ({ item }: { item: Application }) => {
    const isPending = item.status === 'PENDING'
    const isProcessing = processingId === item.id

    return (
      <View style={styles.applicationItem}>
        <View style={styles.applicantInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.applicant.nickname.charAt(0)}
            </Text>
          </View>
          <View style={styles.applicantDetails}>
            <Text style={styles.applicantName}>{item.applicant.nickname}</Text>
            {item.applicant.bio && (
              <Text style={styles.applicantBio} numberOfLines={2}>
                {item.applicant.bio}
              </Text>
            )}
            <Text style={styles.applicationTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>メッセージ</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {isPending ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleAction(item.id, 'REJECT')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.gray[600]} size="small" />
              ) : (
                <Text style={styles.rejectButtonText}>却下</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleAction(item.id, 'APPROVE')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.approveButtonText}>承認</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Text
              style={[
                styles.statusText,
                item.status === 'APPROVED' ? styles.approvedStatus : styles.rejectedStatus,
              ]}
            >
              {item.status === 'APPROVED' ? '✅ 承認済み' : '❌ 却下済み'}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const pendingApplications = applications.filter((a) => a.status === 'PENDING')
  const processedApplications = applications.filter((a) => a.status !== 'PENDING')

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '応募一覧',
          headerBackTitle: '戻る',
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>応募はまだありません</Text>
        </View>
      ) : (
        <FlatList
          data={[...pendingApplications, ...processedApplications]}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadApplications} />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            pendingApplications.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  未対応 ({pendingApplications.length}件)
                </Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[400],
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  applicationItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  applicantInfo: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  applicantDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  applicantBio: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 4,
  },
  applicationTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  messageBox: {
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  messageLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.gray[100],
  },
  rejectButtonText: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: colors.primary[500],
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  approvedStatus: {
    color: colors.primary[600],
  },
  rejectedStatus: {
    color: colors.gray[500],
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
})
