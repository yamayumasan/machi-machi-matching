import { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useNotificationStore } from '@/stores/notification'
import { Notification, NotificationType } from '@/services/notification'
import { colors, spacing } from '@/constants/theme'

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  APPLICATION_RECEIVED: '📩',
  APPLICATION_APPROVED: '✅',
  APPLICATION_REJECTED: '❌',
  OFFER_RECEIVED: '🎁',
  OFFER_ACCEPTED: '🎉',
  OFFER_DECLINED: '😢',
  RECRUITMENT_MATCH: '🎯',
  GROUP_CREATED: '👥',
  NEW_MESSAGE: '💬',
  MEMBER_JOINED: '👋',
}

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    // 通知タイプに応じて遷移
    const data = notification.data as Record<string, string> | null
    if (data?.recruitmentId) {
      router.push(`/recruitment/${data.recruitmentId}`)
    } else if (data?.groupId) {
      router.push(`/group/${data.groupId}`)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unread]}
      onPress={() => handleNotificationPress(item)}
    >
      <Text style={styles.notificationIcon}>
        {NOTIFICATION_ICONS[item.type] || '🔔'}
      </Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {notifications.some((n) => !n.isRead) && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>すべて既読にする</Text>
        </TouchableOpacity>
      )}

      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>通知はありません</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchNotifications}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
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
  markAllButton: {
    padding: spacing.md,
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  markAllText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  unread: {
    backgroundColor: colors.primary[50],
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: colors.gray[600],
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing.sm,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
})
