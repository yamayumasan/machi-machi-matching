<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import MdiIcon from '../components/MdiIcon.vue'
import {
  mdiArrowLeft,
  mdiCheckAll,
  mdiDelete,
  mdiBell,
} from '../lib/icons'

const router = useRouter()
const notificationStore = useNotificationStore()

const loading = ref(true)
const showUnreadOnly = ref(false)

const notifications = computed(() => notificationStore.notifications)
const hasMore = computed(() => {
  const { page, totalPages } = notificationStore.pagination
  return page < totalPages
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

const getNotificationIcon = (_type: string) => {
  // 通知タイプに応じたアイコンを返す（現状は統一）
  return mdiBell
}

const handleNotificationClick = async (notification: { id: string; isRead: boolean; type: string; data: Record<string, unknown> | null }) => {
  // 未読の場合は既読にする
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id)
  }

  // 通知タイプに応じてナビゲーション
  const data = notification.data as Record<string, string> | null
  switch (notification.type) {
    case 'APPLICATION_RECEIVED':
    case 'APPLICATION_APPROVED':
    case 'APPLICATION_REJECTED':
      if (data?.recruitmentId) {
        router.push(`/recruitments/${data.recruitmentId}/applications`)
      }
      break
    case 'OFFER_RECEIVED':
    case 'OFFER_ACCEPTED':
    case 'OFFER_DECLINED':
      // オファー関連 - 今後実装
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
        // 募集詳細へ（ホームで表示）
        router.push('/')
      }
      break
  }
}

const handleMarkAllAsRead = async () => {
  await notificationStore.markAllAsRead()
}

const handleDelete = async (id: string, event: Event) => {
  event.stopPropagation()
  await notificationStore.deleteNotification(id)
}

const handleLoadMore = async () => {
  const nextPage = notificationStore.pagination.page + 1
  await notificationStore.fetchNotifications(nextPage, showUnreadOnly.value)
}

const toggleUnreadOnly = async () => {
  showUnreadOnly.value = !showUnreadOnly.value
  loading.value = true
  await notificationStore.fetchNotifications(1, showUnreadOnly.value)
  loading.value = false
}

onMounted(async () => {
  await notificationStore.fetchNotifications(1, showUnreadOnly.value)
  loading.value = false
})
</script>

<template>
  <div class="notifications-page">
    <!-- Header -->
    <header class="header">
      <div class="container mx-auto px-4 py-3 flex items-center gap-3">
        <button
          @click="router.back()"
          class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MdiIcon :path="mdiArrowLeft" :size="24" />
        </button>
        <h1 class="text-lg font-bold text-gray-900 flex-1">通知</h1>
        <button
          v-if="notificationStore.hasUnread"
          @click="handleMarkAllAsRead"
          class="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <MdiIcon :path="mdiCheckAll" :size="18" />
          <span>すべて既読</span>
        </button>
      </div>
    </header>

    <!-- Filter -->
    <div class="filter-bar">
      <div class="container mx-auto px-4 py-2">
        <button
          @click="toggleUnreadOnly"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            showUnreadOnly
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          未読のみ
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="notifications.length === 0"
        class="flex flex-col items-center justify-center py-16 text-gray-500"
      >
        <MdiIcon :path="mdiBell" :size="48" class="mb-4 opacity-50" />
        <p class="text-lg font-medium mb-1">通知はありません</p>
        <p class="text-sm">{{ showUnreadOnly ? '未読の通知はありません' : '新しい通知が届くとここに表示されます' }}</p>
      </div>

      <!-- Notification List -->
      <div v-else class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          :class="[
            'notification-item',
            { 'is-unread': !notification.isRead }
          ]"
        >
          <div class="notification-icon">
            <MdiIcon :path="getNotificationIcon(notification.type)" :size="20" />
          </div>
          <div class="notification-content">
            <p class="notification-title">{{ notification.title }}</p>
            <p class="notification-body">{{ notification.body }}</p>
            <p class="notification-time">{{ formatDate(notification.createdAt) }}</p>
          </div>
          <button
            @click="handleDelete(notification.id, $event)"
            class="notification-delete"
          >
            <MdiIcon :path="mdiDelete" :size="18" />
          </button>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="px-4 py-4">
          <button
            @click="handleLoadMore"
            class="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            もっと見る
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
}

.header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-bar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.content {
  flex: 1;
}

.notification-list {
  background: white;
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
