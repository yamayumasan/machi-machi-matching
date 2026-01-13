<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import MdiIcon from '../components/MdiIcon.vue'
import NotificationList from '../components/NotificationList.vue'
import {
  mdiArrowLeft,
  mdiCheckAll,
} from '../lib/icons'

const router = useRouter()
const notificationStore = useNotificationStore()

const loading = ref(true)
const showUnreadOnly = ref(false)

const hasMore = computed(() => {
  const { page, totalPages } = notificationStore.pagination
  return page < totalPages
})

const handleMarkAllAsRead = async () => {
  await notificationStore.markAllAsRead()
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
          class="p-2 -ml-2 hover:bg-primary-100 rounded-full transition-colors text-primary-700"
        >
          <MdiIcon :path="mdiArrowLeft" :size="24" />
        </button>
        <h1 class="text-lg font-semibold text-primary-900 flex-1">通知</h1>
        <button
          v-if="notificationStore.hasUnread"
          @click="handleMarkAllAsRead"
          class="flex items-center gap-1 text-sm text-primary-700 hover:text-primary-900"
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
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            showUnreadOnly
              ? 'bg-accent-600 text-white'
              : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
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
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>

      <!-- Notification List -->
      <template v-else>
        <NotificationList
          :show-delete="true"
          :compact="false"
        />

        <!-- Load More -->
        <div v-if="hasMore" class="load-more">
          <button
            @click="handleLoadMore"
            class="w-full py-2 text-sm text-primary-700 hover:text-primary-900 font-medium"
          >
            もっと見る
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
}

.header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-bar {
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.content {
  flex: 1;
  background: white;
}

.load-more {
  padding: 16px;
  border-top: 1px solid #f5f5f5;
}
</style>
