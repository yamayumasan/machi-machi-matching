<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWantToDoStore } from '../stores/wantToDo'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, TIMING_LABELS, type Area } from '@machi/shared'
import ModalSheet from './ModalSheet.vue'
import MdiIcon from './MdiIcon.vue'
import LocationPicker from './LocationPicker.vue'
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
const authStore = useAuthStore()

const selectedCategoryId = ref('')
const selectedTiming = ref('ANYTIME')
const comment = ref('')
const locationData = ref<{
  latitude: number | null
  longitude: number | null
  locationName: string | null
}>({
  latitude: null,
  longitude: null,
  locationName: null,
})

const userArea = computed(() => (authStore.user?.area as Area) || 'TOKYO')

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
      locationData.value = {
        latitude: null,
        longitude: null,
        locationName: null,
      }
    }
  }
)

const handleSubmit = async () => {
  if (!canSubmit.value) return

  const result = await wantToDoStore.createWantToDo({
    categoryId: selectedCategoryId.value,
    timing: selectedTiming.value,
    comment: comment.value || null,
    latitude: locationData.value.latitude,
    longitude: locationData.value.longitude,
    locationName: locationData.value.locationName,
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
              'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              selectedCategoryId === category.id
                ? 'border-accent-600 bg-accent-50'
                : 'border-primary-200 hover:border-primary-300',
            ]"
          >
            <MdiIcon :path="getIconPath(category.icon)" :size="24" :class="selectedCategoryId === category.id ? 'text-accent-600' : 'text-primary-600'" />
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
              'py-2.5 px-4 rounded-lg border-2 text-sm transition-all',
              selectedTiming === key
                ? 'border-accent-600 bg-accent-50 text-accent-700'
                : 'border-primary-200 hover:border-primary-300 text-primary-700',
            ]"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Location (optional) -->
      <div>
        <LocationPicker
          v-model="locationData"
          :area="userArea"
          :show-map-option="true"
          label="場所（任意）"
          :required="false"
        />
        <p class="text-xs text-primary-400 mt-2">
          ※ 場所を設定するとマップ上に表示されます
        </p>
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
          class="w-full px-4 py-2.5 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600 resize-none"
          placeholder="例：初心者ですが一緒に楽しみたいです！"
        ></textarea>
        <p class="text-xs text-primary-400 text-right mt-1">{{ comment.length }}/200</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
        {{ error }}
      </div>
    </form>

    <template #footer>
      <div class="flex gap-3 p-4">
        <button
          type="button"
          @click="emit('update:modelValue', false)"
          class="flex-1 py-3 border border-primary-200 rounded-lg font-medium hover:bg-primary-50 transition-colors text-primary-700"
        >
          キャンセル
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="flex-1 py-3 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
