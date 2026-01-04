<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import MdiIcon from './MdiIcon.vue'
import { mdiBell, mdiBellOutline } from '../lib/icons'

const router = useRouter()
const notificationStore = useNotificationStore()

const showDropdown = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const goToNotifications = () => {
  showDropdown.value = false
  router.push('/notifications')
}

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.notification-bell')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  // 初期ロード
  notificationStore.fetchUnreadCount()

  // 1分ごとにポーリング
  pollInterval = setInterval(() => {
    notificationStore.fetchUnreadCount()
  }, 60000)

  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="notification-bell relative">
    <button
      @click="toggleDropdown"
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

    <!-- ドロップダウン -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown"
        class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[2000]"
      >
        <div class="p-3 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">通知</h3>
            <span
              v-if="notificationStore.hasUnread"
              class="text-xs text-primary-600"
            >
              {{ notificationStore.unreadCount }}件の未読
            </span>
          </div>
        </div>

        <div class="p-4 text-center">
          <button
            @click="goToNotifications"
            class="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            通知一覧を見る
          </button>
        </div>
      </div>
    </Transition>
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
</style>
