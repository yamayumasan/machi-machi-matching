<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '../stores/recruitment'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, AREA_LABELS } from '@machi/shared'

const router = useRouter()
const recruitmentStore = useRecruitmentStore()
const authStore = useAuthStore()

// Filters
const selectedCategory = ref('')
const selectedArea = ref(authStore.user?.area || '')

const isLoading = computed(() => recruitmentStore.isLoading)
const recruitments = computed(() => recruitmentStore.recruitments)
const pagination = computed(() => recruitmentStore.pagination)

onMounted(async () => {
  await loadRecruitments()
})

const loadRecruitments = async () => {
  await recruitmentStore.fetchRecruitments({
    categoryId: selectedCategory.value || undefined,
    area: selectedArea.value || undefined,
  })
}

watch([selectedCategory, selectedArea], () => {
  loadRecruitments()
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCreatedAt = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

const goToDetail = (id: string) => {
  router.push(`/recruitments/${id}`)
}

const goToCreate = () => {
  router.push('/recruitments/new')
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-lg font-bold">募集</h1>
        </div>
        <button
          @click="goToCreate"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          募集する
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
            <label class="block text-xs text-gray-500 mb-1">エリア</label>
            <select
              v-model="selectedArea"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              <option v-for="(label, key) in AREA_LABELS" :key="key" :value="key">
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
      <div v-else-if="recruitments.length === 0" class="text-center py-12">
        <div class="text-4xl mb-4">📢</div>
        <p class="text-gray-500">募集が見つかりませんでした</p>
        <button
          @click="goToCreate"
          class="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          最初の募集を作成する
        </button>
      </div>

      <!-- Recruitment list -->
      <div v-else class="space-y-4">
        <div
          v-for="item in recruitments"
          :key="item.id"
          @click="goToDetail(item.id)"
          class="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-4">
            <!-- Creator avatar -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                <img
                  v-if="item.creator?.avatarUrl"
                  :src="item.creator.avatarUrl"
                  :alt="item.creator.nickname || ''"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-primary-600 font-semibold">
                  {{ item.creator?.nickname?.charAt(0) || '?' }}
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-gray-900">{{ item.creator?.nickname }}</span>
                <span class="text-xs text-gray-400">
                  {{ AREA_LABELS[item.area as keyof typeof AREA_LABELS] }}
                </span>
              </div>

              <h3 class="font-semibold text-gray-800 mb-2">{{ item.title }}</h3>

              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">{{ item.category.icon }}</span>
                <span class="text-sm text-gray-600">{{ item.category.name }}</span>
              </div>

              <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <div v-if="item.datetime || item.datetimeFlex" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ formatDate(item.datetime) || item.datetimeFlex }}</span>
                </div>
                <div v-if="item.location" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ item.location }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{{ item.currentPeople }}/{{ item.maxPeople }}人</span>
                </div>
              </div>

              <p v-if="item.description" class="text-gray-600 text-sm line-clamp-2 mt-2">
                {{ item.description }}
              </p>

              <div class="mt-2 text-xs text-gray-400">
                {{ formatCreatedAt(item.createdAt) }} 投稿
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
          @click="recruitmentStore.fetchRecruitments({ page })"
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
  </div>
</template>
