<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWantToDoStore } from '../stores/wantToDo'
import { TIMING_LABELS, AREA_LABELS } from '@machi/shared'

const router = useRouter()
const route = useRoute()
const wantToDoStore = useWantToDoStore()

const showDeleteConfirm = ref(false)

const isLoading = computed(() => wantToDoStore.isLoading)
const wantToDo = computed(() => wantToDoStore.currentWantToDo)
const error = computed(() => wantToDoStore.error)

onMounted(async () => {
  const id = route.params.id as string
  await wantToDoStore.fetchWantToDo(id)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatExpiresAt = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '期限切れ'
  if (diffDays === 0) return '今日まで'
  if (diffDays === 1) return '明日まで'
  return `あと${diffDays}日`
}

const getTimingLabel = (timing: string) => {
  return TIMING_LABELS[timing as keyof typeof TIMING_LABELS] || timing
}

const handleDelete = async () => {
  if (!wantToDo.value) return

  const success = await wantToDoStore.deleteWantToDo(wantToDo.value.id)
  if (success) {
    router.push('/want-to-dos')
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex items-center gap-4">
        <button @click="goBack" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-bold">やりたいこと詳細</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">{{ error }}</p>
        <button
          @click="goBack"
          class="mt-4 px-4 py-2 text-primary-600 hover:underline"
        >
          戻る
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="wantToDo" class="space-y-6">
        <!-- Category & Timing -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-4xl">{{ wantToDo.category.icon }}</span>
            <div>
              <h2 class="text-xl font-bold">{{ wantToDo.category.name }}</h2>
              <span class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm inline-block mt-1">
                {{ getTimingLabel(wantToDo.timing) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 text-sm text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ formatExpiresAt(wantToDo.expiresAt) }}</span>
          </div>
        </div>

        <!-- Comment -->
        <div v-if="wantToDo.comment" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">コメント</h3>
          <p class="text-gray-800">{{ wantToDo.comment }}</p>
        </div>

        <!-- User info -->
        <div v-if="wantToDo.user" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-4">表明者</h3>
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                v-if="wantToDo.user.avatarUrl"
                :src="wantToDo.user.avatarUrl"
                :alt="wantToDo.user.nickname || ''"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-primary-600 font-semibold text-xl">
                {{ wantToDo.user.nickname?.charAt(0) || '?' }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-lg">{{ wantToDo.user.nickname }}</p>
              <p class="text-sm text-gray-500">
                {{ AREA_LABELS[wantToDo.user.area as keyof typeof AREA_LABELS] }}
              </p>
              <p v-if="wantToDo.user.bio" class="text-gray-600 mt-2 text-sm">
                {{ wantToDo.user.bio }}
              </p>
            </div>
          </div>
        </div>

        <!-- Meta info -->
        <div class="text-center text-sm text-gray-400">
          {{ formatDate(wantToDo.createdAt) }} に投稿
        </div>

        <!-- Actions (if owner) -->
        <div v-if="wantToDo.isOwner" class="flex gap-3">
          <button
            @click="showDeleteConfirm = true"
            class="flex-1 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            削除する
          </button>
        </div>
      </div>
    </main>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <h3 class="text-lg font-bold mb-4">削除の確認</h3>
          <p class="text-gray-600 mb-6">
            このやりたいこと表明を削除しますか？この操作は取り消せません。
          </p>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              @click="handleDelete"
              :disabled="isLoading"
              class="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              削除する
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
