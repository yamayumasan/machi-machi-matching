<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWantToDoStore } from '../stores/wantToDo'
import { CATEGORIES, TIMING_LABELS } from '@machi/shared'
import ModalSheet from './ModalSheet.vue'
import MdiIcon from './MdiIcon.vue'
import { getIconPath } from '../lib/icons'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
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

// モーダルが閉じたらフォームをリセット
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      selectedCategoryId.value = ''
      selectedTiming.value = 'ANYTIME'
      comment.value = ''
    }
  }
)

const handleSubmit = async () => {
  if (!canSubmit.value) return

  const result = await wantToDoStore.createWantToDo({
    categoryId: selectedCategoryId.value,
    timing: selectedTiming.value,
    comment: comment.value || null,
  })

  if (result) {
    emit('created')
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <ModalSheet
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="やりたいことを表明"
    max-width="md"
  >
    <form @submit.prevent="handleSubmit" class="p-4 space-y-6">
      <!-- Category selection -->
      <div>
        <label class="block text-sm font-medium text-primary-700 mb-2">
          カテゴリ <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="category in CATEGORIES"
            :key="category.id"
            type="button"
            @click="selectedCategoryId = category.id"
            :class="[
              'flex flex-col items-center p-3 rounded border-2 transition-all',
              selectedCategoryId === category.id
                ? 'border-primary-900 bg-primary-50'
                : 'border-primary-200 hover:border-primary-300',
            ]"
          >
            <MdiIcon :path="getIconPath(category.icon)" :size="24" class="text-primary-700" />
            <span class="text-xs text-primary-700 mt-1">{{ category.name }}</span>
          </button>
        </div>
      </div>

      <!-- Timing selection -->
      <div>
        <label class="block text-sm font-medium text-primary-700 mb-2">
          タイミング <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(label, key) in TIMING_LABELS"
            :key="key"
            type="button"
            @click="selectedTiming = key"
            :class="[
              'py-2 px-4 rounded border-2 text-sm transition-all',
              selectedTiming === key
                ? 'border-primary-900 bg-primary-50 text-primary-900'
                : 'border-primary-200 hover:border-primary-300 text-primary-700',
            ]"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Comment -->
      <div>
        <label class="block text-sm font-medium text-primary-700 mb-2">
          コメント（任意）
        </label>
        <textarea
          v-model="comment"
          rows="3"
          maxlength="200"
          class="w-full px-4 py-2 text-base border border-primary-200 rounded focus:ring-1 focus:ring-primary-700 focus:border-primary-400 resize-none"
          placeholder="例：初心者ですが一緒に楽しみたいです！"
        ></textarea>
        <p class="text-xs text-primary-400 text-right mt-1">{{ comment.length }}/200</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
        {{ error }}
      </div>
    </form>

    <template #footer>
      <div class="flex gap-3 p-4">
        <button
          type="button"
          @click="emit('update:modelValue', false)"
          class="flex-1 py-3 border border-primary-200 rounded font-medium hover:bg-primary-50 transition-colors text-primary-700"
        >
          キャンセル
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="flex-1 py-3 bg-primary-900 text-white rounded font-medium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </template>
  </ModalSheet>
</template>
