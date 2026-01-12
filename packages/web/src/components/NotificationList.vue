<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, type Notification } from '../stores/notification'
import MdiIcon from './MdiIcon.vue'
import { mdiBell, mdiDelete } from '../lib/icons'

interface Props {
  maxItems?: number
  showDelete?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 0, // 0 = 全件表示
  showDelete: true,
  compact: false,
})

const emit = defineEmits<{
  itemClick: [notification: Notification]
}>()

const router = useRouter()
const notificationStore = useNotificationStore()

const displayedNotifications = computed(() => {
  if (props.maxItems > 0) {
    return notificationStore.notifications.slice(0, props.maxItems)
  }
  return notificationStore.notifications
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

const handleNotificationClick = async (notification: Notification) => {
  // 未読の場合は既読にする
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id)
  }

  emit('itemClick', notification)

  // 通知タイプに応じてナビゲーション
  const data = notification.data as Record<string, string> | null
  switch (notification.type) {
    case 'APPLICATION_RECEIVED':
      // 募集者向け: 申請管理画面へ
      if (data?.recruitmentId) {
        router.push(`/recruitments/${data.recruitmentId}/applications`)
      }
      break
    case 'APPLICATION_APPROVED':
      // 申請者向け: グループがあればグループへ、なければ募集詳細へ
      if (data?.groupId) {
        router.push(`/groups/${data.groupId}`)
      } else if (data?.recruitmentId) {
        router.push(`/recruitments/${data.recruitmentId}`)
      }
      break
    case 'APPLICATION_REJECTED':
      // 申請者向け: 募集一覧（ホーム）へ
      router.push('/')
      break
    case 'GROUP_CREATED':
    case 'NEW_MESSAGE':
    case 'MEMBER_JOINED':
      if (data?.groupId) {
        router.push(`/groups/${data.groupId}`)
      }
      break
    case 'RECRUITMENT_MATCH':
      if (data?.recruitmentId) {
        router.push('/')
      }
      break
  }
}

const handleDelete = async (id: string, event: Event) => {
  event.stopPropagation()
  await notificationStore.deleteNotification(id)
}
</script>

<template>
  <div class="notification-list">
    <!-- Empty State -->
    <div
      v-if="displayedNotifications.length === 0"
      class="empty-state"
      :class="{ 'compact': compact }"
    >
      <MdiIcon :path="mdiBell" :size="compact ? 32 : 48" class="opacity-50" />
      <p class="text-sm text-gray-500 mt-2">通知はありません</p>
    </div>

    <!-- Notification Items -->
    <div
      v-for="notification in displayedNotifications"
      :key="notification.id"
      @click="handleNotificationClick(notification)"
      class="notification-item"
      :class="{
        'is-unread': !notification.isRead,
        'compact': compact
      }"
    >
      <div class="notification-icon" :class="{ 'compact': compact }">
        <MdiIcon :path="mdiBell" :size="compact ? 16 : 20" />
      </div>
      <div class="notification-content">
        <p class="notification-title" :class="{ 'compact': compact }">{{ notification.title }}</p>
        <p class="notification-body" :class="{ 'compact': compact }">{{ notification.body }}</p>
        <p class="notification-time">{{ formatDate(notification.createdAt) }}</p>
      </div>
      <button
        v-if="showDelete"
        @click="handleDelete(notification.id, $event)"
        class="notification-delete"
      >
        <MdiIcon :path="mdiDelete" :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.notification-list {
  background: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #9ca3af;
}

.empty-state.compact {
  padding: 24px 16px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.15s;
}

.notification-item.compact {
  padding: 12px;
  gap: 10px;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.is-unread {
  background-color: #eff6ff;
}

.notification-item.is-unread:hover {
  background-color: #dbeafe;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 50%;
}

.notification-icon.compact {
  width: 32px;
  height: 32px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
  margin-bottom: 2px;
}

.notification-title.compact {
  font-size: 13px;
}

.notification-body {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-body.compact {
  font-size: 12px;
  -webkit-line-clamp: 1;
}

.notification-time {
  color: #9ca3af;
  font-size: 12px;
}

.notification-delete {
  flex-shrink: 0;
  padding: 8px;
  margin: -8px;
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.notification-item:hover .notification-delete {
  opacity: 1;
}

.notification-delete:hover {
  color: #ef4444;
}
</style>
