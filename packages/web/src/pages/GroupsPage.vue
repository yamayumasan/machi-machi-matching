<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupStore } from '../stores/group'

const router = useRouter()
const groupStore = useGroupStore()

const isLoading = computed(() => groupStore.isLoading)
const groups = computed(() => groupStore.sortedGroups)

onMounted(async () => {
  await groupStore.fetchGroups()
})

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

const goToChat = (groupId: string) => {
  router.push(`/groups/${groupId}`)
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white border-b border-primary-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex items-center gap-4">
        <button @click="goBack" class="text-primary-500 hover:text-primary-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-primary-900">グループチャット</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-accent-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="groups.length === 0" class="text-center py-12">
        <div class="text-4xl mb-4">💬</div>
        <p class="text-primary-600 mb-2">参加中のグループはありません</p>
        <p class="text-sm text-primary-400">募集に参加するとグループが作成されます</p>
      </div>

      <!-- Group list -->
      <div v-else class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.id"
          @click="goToChat(group.id)"
          class="bg-white rounded-lg border border-primary-200 p-4 cursor-pointer hover:border-primary-300 transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Group icon -->
            <div class="flex-shrink-0 relative">
              <div class="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                <span class="text-2xl">{{ group.recruitment.category.icon }}</span>
              </div>
              <!-- 未読バッジ -->
              <span
                v-if="group.unreadCount && group.unreadCount > 0"
                class="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center bg-accent-600 text-white text-xs font-bold rounded-full px-1"
              >
                {{ group.unreadCount > 99 ? '99+' : group.unreadCount }}
              </span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-semibold text-primary-800 truncate">{{ group.name }}</h3>
                <span v-if="group.lastMessage" class="text-xs text-primary-400 flex-shrink-0 ml-2">
                  {{ formatTime(group.lastMessage.createdAt) }}
                </span>
              </div>

              <p class="text-sm text-primary-500 mb-2">
                {{ group.members.length }}人のメンバー
              </p>

              <p v-if="group.lastMessage" class="text-sm text-primary-600 truncate">
                <span class="text-primary-400">{{ group.lastMessage.senderNickname }}:</span>
                {{ group.lastMessage.content }}
              </p>
              <p v-else class="text-sm text-primary-400">
                まだメッセージはありません
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
