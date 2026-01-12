<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import MdiIcon from './MdiIcon.vue'
import ModalSheet from './ModalSheet.vue'
import NotificationList from './NotificationList.vue'
import { mdiBell, mdiBellOutline, mdiCheckAll } from '../lib/icons'

const router = useRouter()
const notificationStore = useNotificationStore()

const showDropdown = ref(false)
const showModal = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

// レスポンシブ判定
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const toggleNotifications = () => {
  if (isMobile.value) {
    // モバイル: モーダル表示
    showModal.value = true
    // 通知一覧を取得
    notificationStore.fetchNotifications(1, false)
  } else {
    // PC: ドロップダウン表示
    showDropdown.value = !showDropdown.value
    if (showDropdown.value) {
      // 通知一覧を取得
      notificationStore.fetchNotifications(1, false)
    }
  }
}

const goToNotifications = () => {
  showDropdown.value = false
  showModal.value = false
  router.push('/notifications')
}

const handleMarkAllAsRead = async () => {
  await notificationStore.markAllAsRead()
}

const handleNotificationClick = () => {
  showDropdown.value = false
  showModal.value = false
}

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.notification-bell')) {
    showDropdown.value = false
  }
}

const hasMoreNotifications = computed(() => {
  return notificationStore.pagination.total > 10
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 初期ロード
  notificationStore.fetchUnreadCount()

  // 1分ごとにポーリング
  pollInterval = setInterval(() => {
    notificationStore.fetchUnreadCount()
  }, 60000)

  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  if (pollInterval) {
    clearInterval(pollInterval)
  }
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="notification-bell relative">
    <button
      @click="toggleNotifications"
      class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="通知"
    >
      <MdiIcon
        :path="notificationStore.hasUnread ? mdiBell : mdiBellOutline"
        :size="24"
      />

      <!-- 未読バッジ -->
      <span
        v-if="notificationStore.hasUnread"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1"
      >
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </button>

    <!-- PC版: ドロップダウン -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown && !isMobile"
        class="dropdown-panel"
      >
        <!-- ヘッダー -->
        <div class="dropdown-header">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">通知</h3>
            <button
              v-if="notificationStore.hasUnread"
              @click="handleMarkAllAsRead"
              class="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
            >
              <MdiIcon :path="mdiCheckAll" :size="14" />
              <span>すべて既読</span>
            </button>
          </div>
        </div>

        <!-- 通知リスト -->
        <div class="dropdown-content">
          <div v-if="notificationStore.isLoading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
          <NotificationList
            v-else
            :max-items="10"
            :show-delete="false"
            :compact="true"
            @item-click="handleNotificationClick"
          />
        </div>

        <!-- フッター -->
        <div v-if="hasMoreNotifications" class="dropdown-footer">
          <button
            @click="goToNotifications"
            class="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            すべての通知を見る
          </button>
        </div>
      </div>
    </Transition>

    <!-- モバイル版: モーダル -->
    <ModalSheet v-model="showModal" title="通知">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-lg font-bold">通知</h2>
          <button
            v-if="notificationStore.hasUnread"
            @click="handleMarkAllAsRead"
            class="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <MdiIcon :path="mdiCheckAll" :size="16" />
            <span>すべて既読</span>
          </button>
        </div>
      </template>

      <template #default>
        <div class="modal-content">
          <div v-if="notificationStore.isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          <NotificationList
            v-else
            :max-items="20"
            :show-delete="true"
            :compact="false"
            @item-click="handleNotificationClick"
          />

          <!-- すべて見るボタン -->
          <div v-if="hasMoreNotifications" class="px-4 py-4 border-t border-gray-100">
            <button
              @click="goToNotifications"
              class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              すべての通知を見る
            </button>
          </div>
        </div>
      </template>
    </ModalSheet>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-panel {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 360px;
  max-height: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.dropdown-content {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.dropdown-footer {
  padding: 8px 16px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.modal-content {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
