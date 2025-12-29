<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '../stores/recruitment'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, AREA_LABELS } from '@machi/shared'

const router = useRouter()
const recruitmentStore = useRecruitmentStore()
const authStore = useAuthStore()

const isLoading = computed(() => recruitmentStore.isLoading)

// Form data
const title = ref('')
const categoryId = ref('')
const description = ref('')
const useDatetime = ref(true) // true = 具体的な日時, false = 柔軟な日時
const datetime = ref('')
const datetimeFlex = ref('')
const area = ref(authStore.user?.area || 'TOKYO')
const location = ref('')
const minPeople = ref(2)
const maxPeople = ref(5)

// Validation
const errors = ref<Record<string, string>>({})

const validate = () => {
  errors.value = {}

  if (!title.value.trim()) {
    errors.value.title = 'タイトルを入力してください'
  }

  if (!categoryId.value) {
    errors.value.categoryId = 'カテゴリを選択してください'
  }

  if (!useDatetime.value && !datetimeFlex.value.trim()) {
    errors.value.datetimeFlex = '日時の柔軟性を入力してください'
  }

  if (minPeople.value < 1) {
    errors.value.minPeople = '最少人数は1以上にしてください'
  }

  if (maxPeople.value < minPeople.value) {
    errors.value.maxPeople = '最大人数は最少人数以上にしてください'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  const result = await recruitmentStore.createRecruitment({
    title: title.value.trim(),
    categoryId: categoryId.value,
    description: description.value.trim() || null,
    datetime: useDatetime.value && datetime.value ? new Date(datetime.value).toISOString() : null,
    datetimeFlex: !useDatetime.value ? datetimeFlex.value.trim() : null,
    area: area.value,
    location: location.value.trim() || null,
    minPeople: minPeople.value,
    maxPeople: maxPeople.value,
  })

  if (result) {
    router.push(`/recruitments/${result.id}`)
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 class="text-lg font-bold">募集を作成</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="例：週末にカフェでコーヒー飲みませんか？"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.title }"
          />
          <p v-if="errors.title" class="mt-1 text-sm text-red-500">{{ errors.title }}</p>
        </div>

        <!-- Category -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="cat in CATEGORIES"
              :key="cat.id"
              type="button"
              @click="categoryId = cat.id"
              :class="[
                'p-3 rounded-lg border-2 text-center transition-colors',
                categoryId === cat.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
            >
              <div class="text-2xl mb-1">{{ cat.icon }}</div>
              <div class="text-xs font-medium">{{ cat.name }}</div>
            </button>
          </div>
          <p v-if="errors.categoryId" class="mt-2 text-sm text-red-500">{{ errors.categoryId }}</p>
        </div>

        <!-- Description -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            詳細説明
          </label>
          <textarea
            v-model="description"
            placeholder="募集の詳細を入力してください（任意）"
            rows="4"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- DateTime -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            日時
          </label>
          <div class="flex gap-4 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="useDatetime"
                :value="true"
                class="text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm">日時を指定</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="useDatetime"
                :value="false"
                class="text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm">柔軟に調整</span>
            </label>
          </div>

          <div v-if="useDatetime">
            <input
              v-model="datetime"
              type="datetime-local"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div v-else>
            <input
              v-model="datetimeFlex"
              type="text"
              placeholder="例：今週末の午後、平日の夜など"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.datetimeFlex }"
            />
            <p v-if="errors.datetimeFlex" class="mt-1 text-sm text-red-500">{{ errors.datetimeFlex }}</p>
          </div>
        </div>

        <!-- Area -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            エリア <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-4">
            <label
              v-for="(label, key) in AREA_LABELS"
              :key="key"
              class="flex-1"
            >
              <input
                type="radio"
                v-model="area"
                :value="key"
                class="sr-only peer"
              />
              <div
                class="p-4 text-center rounded-lg border-2 cursor-pointer transition-colors peer-checked:border-primary-500 peer-checked:bg-primary-50 border-gray-200 hover:border-gray-300"
              >
                <span class="font-medium">{{ label }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Location -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            場所
          </label>
          <input
            v-model="location"
            type="text"
            placeholder="例：仙台駅周辺、渋谷のカフェなど"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <!-- People -->
        <div class="bg-white rounded-lg shadow-sm p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            募集人数
          </label>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1">最少人数</label>
              <select
                v-model="minPeople"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option v-for="n in 10" :key="n" :value="n">{{ n }}人</option>
              </select>
            </div>
            <span class="text-gray-400 pt-4">〜</span>
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1">最大人数</label>
              <select
                v-model="maxPeople"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option v-for="n in 20" :key="n" :value="n">{{ n }}人</option>
              </select>
            </div>
          </div>
          <p v-if="errors.minPeople" class="mt-1 text-sm text-red-500">{{ errors.minPeople }}</p>
          <p v-if="errors.maxPeople" class="mt-1 text-sm text-red-500">{{ errors.maxPeople }}</p>
          <p class="mt-2 text-xs text-gray-500">※ 募集者を含む人数を指定してください</p>
        </div>

        <!-- Error message -->
        <div v-if="recruitmentStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-600 text-sm">{{ recruitmentStore.error }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoading">作成中...</span>
          <span v-else>募集を作成する</span>
        </button>
      </form>
    </main>
  </div>
</template>
