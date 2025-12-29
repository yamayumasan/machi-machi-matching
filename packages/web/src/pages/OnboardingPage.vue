<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, AREA_LABELS } from '@machi/shared'

const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const totalSteps = 3

// Step 1: プロフィール
const nickname = ref('')
const bio = ref('')

// Step 2: カテゴリ
const selectedCategories = ref<string[]>([])

// Step 3: エリア
const selectedArea = ref<string>('')

const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

onMounted(() => {
  // If user already has some data, prefill
  if (authStore.user) {
    if (authStore.user.nickname) nickname.value = authStore.user.nickname
    if (authStore.user.bio) bio.value = authStore.user.bio
    if (authStore.user.area) selectedArea.value = authStore.user.area
    if (authStore.user.interests) {
      selectedCategories.value = authStore.user.interests.map((i) => i.id)
    }
  }
})

const toggleCategory = (categoryId: string) => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategories.value.push(categoryId)
  } else {
    selectedCategories.value.splice(index, 1)
  }
}

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleComplete = async () => {
  const success = await authStore.completeOnboarding({
    nickname: nickname.value,
    bio: bio.value || null,
    area: selectedArea.value,
    categoryIds: selectedCategories.value,
  })

  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
    <div class="w-full max-w-lg">
      <!-- Progress -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-600">Step {{ currentStep }}/{{ totalSteps }}</span>
          <span class="text-sm text-gray-600">
            {{
              currentStep === 1
                ? 'プロフィール設定'
                : currentStep === 2
                  ? '興味のあるカテゴリ'
                  : '活動エリア'
            }}
          </span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full">
          <div
            class="h-2 bg-primary-600 rounded-full transition-all"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-8">
        <!-- Step 1: プロフィール -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="text-center mb-6">
            <div
              class="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
            >
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p class="text-sm text-gray-500 mt-2">アイコンを設定（任意）</p>
          </div>

          <div>
            <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">
              ニックネーム <span class="text-red-500">*</span>
            </label>
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              required
              maxlength="50"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="ニックネームを入力"
            />
          </div>

          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">
              自己紹介（任意）
            </label>
            <textarea
              id="bio"
              v-model="bio"
              rows="3"
              maxlength="500"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="自己紹介を入力"
            ></textarea>
            <p class="text-xs text-gray-400 text-right mt-1">{{ bio.length }}/500</p>
          </div>
        </div>

        <!-- Step 2: カテゴリ選択 -->
        <div v-if="currentStep === 2">
          <p class="text-gray-600 mb-4">興味のあるものを選んでください（複数選択可）</p>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="category in CATEGORIES"
              :key="category.id"
              @click="toggleCategory(category.id)"
              :class="[
                'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                selectedCategories.includes(category.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
            >
              <span class="text-2xl mb-1">{{ category.icon }}</span>
              <span class="text-xs text-gray-700">{{ category.name }}</span>
            </button>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            {{ selectedCategories.length }}件選択中
          </p>
        </div>

        <!-- Step 3: エリア選択 -->
        <div v-if="currentStep === 3">
          <p class="text-gray-600 mb-4">主に活動するエリアを選んでください</p>
          <div class="space-y-3">
            <button
              v-for="(label, key) in AREA_LABELS"
              :key="key"
              @click="selectedArea = key"
              :class="[
                'w-full py-4 px-6 rounded-lg border-2 text-left transition-all flex items-center',
                selectedArea === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
            >
              <span class="text-2xl mr-3">{{ key === 'TOKYO' ? '🗼' : '🏯' }}</span>
              <span class="font-medium">{{ label }}</span>
            </button>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {{ error }}
        </div>

        <!-- Navigation -->
        <div class="flex justify-between mt-8">
          <button
            v-if="currentStep > 1"
            @click="prevStep"
            :disabled="isLoading"
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            戻る
          </button>
          <div v-else></div>

          <button
            v-if="currentStep < totalSteps"
            @click="nextStep"
            :disabled="(currentStep === 1 && !nickname) || (currentStep === 2 && selectedCategories.length === 0)"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            次へ
          </button>
          <button
            v-else
            @click="handleComplete"
            :disabled="!selectedArea || isLoading"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isLoading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              設定中...
            </span>
            <span v-else>はじめる</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
