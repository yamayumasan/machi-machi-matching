<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWantToDoStore } from '../stores/wantToDo'
import { CATEGORIES, TIMING_LABELS } from '@machi/shared'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const wantToDoStore = useWantToDoStore()

const selectedCategoryId = ref('')
const selectedTiming = ref('ANYTIME')
const comment = ref('')

const isLoading = computed(() => wantToDoStore.isLoading)
const error = computed(() => wantToDoStore.error)

const canSubmit = computed(() => {
  return selectedCategoryId.value && selectedTiming.value && !isLoading.value
})

const handleSubmit = async () => {
  if (!canSubmit.value) return

  const result = await wantToDoStore.createWantToDo({
    categoryId: selectedCategoryId.value,
    timing: selectedTiming.value,
    comment: comment.value || null,
  })

  if (result) {
    emit('created')
    emit('close')
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold">やりたいことを表明</h2>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Category selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="category in CATEGORIES"
              :key="category.id"
              type="button"
              @click="selectedCategoryId = category.id"
              :class="[
                'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                selectedCategoryId === category.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]"
            >
              <span class="text-xl">{{ category.icon }}</span>
              <span class="text-xs text-gray-700 mt-1">{{ category.name }}</span>
            </button>
          </div>
        </div>

        <!-- Timing selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            タイミング <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="(label, key) in TIMING_LABELS"
              :key="key"
              type="button"
              @click="selectedTiming = key"
              :class="[
                'py-2 px-4 rounded-lg border-2 text-sm transition-all',
                selectedTiming === key
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700',
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <!-- Comment -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            コメント（任意）
          </label>
          <textarea
            v-model="comment"
            rows="3"
            maxlength="200"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="例：初心者ですが一緒に楽しみたいです！"
          ></textarea>
          <p class="text-xs text-gray-400 text-right mt-1">{{ comment.length }}/200</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {{ error }}
        </div>

        <!-- Submit -->
        <div class="flex gap-3">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            :disabled="!canSubmit"
            class="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              作成中...
            </span>
            <span v-else>表明する</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
