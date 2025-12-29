<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWantToDoStore } from '../stores/wantToDo'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, TIMING_LABELS, AREA_LABELS } from '@machi/shared'

const router = useRouter()
const wantToDoStore = useWantToDoStore()
const authStore = useAuthStore()

// Filters
const selectedCategory = ref('')
const selectedTiming = ref('')

const isLoading = computed(() => wantToDoStore.isLoading)
const wantToDos = computed(() => wantToDoStore.wantToDos)
const pagination = computed(() => wantToDoStore.pagination)

const showCreateModal = ref(false)

onMounted(async () => {
  await loadWantToDos()
})

const loadWantToDos = async () => {
  await wantToDoStore.fetchWantToDos({
    categoryId: selectedCategory.value || undefined,
    timing: selectedTiming.value || undefined,
    area: authStore.user?.area || undefined,
  })
}

watch([selectedCategory, selectedTiming], () => {
  loadWantToDos()
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

const getTimingLabel = (timing: string) => {
  return TIMING_LABELS[timing as keyof typeof TIMING_LABELS] || timing
}

const goToDetail = (id: string) => {
  router.push(`/want-to-dos/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button @click="router.push('/')" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-lg font-bold">やりたいこと</h1>
        </div>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          表明する
        </button>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[150px]">
            <label class="block text-xs text-gray-500 mb-1">カテゴリ</label>
            <select
              v-model="selectedCategory"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              <option v-for="cat in CATEGORIES" :key="cat.id" :value="cat.id">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="flex-1 min-w-[150px]">
            <label class="block text-xs text-gray-500 mb-1">タイミング</label>
            <select
              v-model="selectedTiming"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              <option v-for="(label, key) in TIMING_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="wantToDos.length === 0" class="text-center py-12">
        <div class="text-4xl mb-4">🔍</div>
        <p class="text-gray-500">やりたいことが見つかりませんでした</p>
        <button
          @click="showCreateModal = true"
          class="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          最初の表明をする
        </button>
      </div>

      <!-- Want-to-do list -->
      <div v-else class="space-y-4">
        <div
          v-for="item in wantToDos"
          :key="item.id"
          @click="goToDetail(item.id)"
          class="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-4">
            <!-- User avatar -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                <img
                  v-if="item.user?.avatarUrl"
                  :src="item.user.avatarUrl"
                  :alt="item.user.nickname || ''"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-primary-600 font-semibold">
                  {{ item.user?.nickname?.charAt(0) || '?' }}
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-gray-900">{{ item.user?.nickname }}</span>
                <span class="text-xs text-gray-400">
                  {{ AREA_LABELS[item.user?.area as keyof typeof AREA_LABELS] }}
                </span>
              </div>

              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">{{ item.category.icon }}</span>
                <span class="font-semibold text-gray-800">{{ item.category.name }}</span>
                <span class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                  {{ getTimingLabel(item.timing) }}
                </span>
              </div>

              <p v-if="item.comment" class="text-gray-600 text-sm line-clamp-2">
                {{ item.comment }}
              </p>

              <div class="mt-2 text-xs text-gray-400">
                {{ formatDate(item.createdAt) }} 投稿
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="mt-6 flex justify-center gap-2">
        <button
          v-for="page in pagination.totalPages"
          :key="page"
          @click="wantToDoStore.fetchWantToDos({ page })"
          :class="[
            'px-3 py-1 rounded text-sm',
            page === pagination.page
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100',
          ]"
        >
          {{ page }}
        </button>
      </div>
    </main>

    <!-- Create Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <CreateWantToDoModal @close="showCreateModal = false" @created="loadWantToDos" />
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import CreateWantToDoModal from '../components/CreateWantToDoModal.vue'

export default {
  components: {
    CreateWantToDoModal,
  },
}
</script>
