<script setup lang="ts">
import MdiIcon from './MdiIcon.vue'
import { mdiCheckCircle, mdiEye, mdiHome, mdiPlus } from '../lib/icons'

interface Props {
  modelValue: boolean
  recruitmentId?: string
  recruitmentTitle?: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  viewRecruitment: []
  goHome: []
  createAnother: []
}>()

const handleViewRecruitment = () => {
  emit('viewRecruitment')
  emit('update:modelValue', false)
}

const handleGoHome = () => {
  emit('goHome')
  emit('update:modelValue', false)
}

const handleCreateAnother = () => {
  emit('createAnother')
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center"
          >
            <!-- Success Icon -->
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MdiIcon :path="mdiCheckCircle" :size="40" class="text-green-500" />
              </div>
            </div>

            <!-- Title -->
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              募集を作成しました！
            </h2>

            <!-- Recruitment Title -->
            <p v-if="recruitmentTitle" class="text-gray-600 mb-6">
              「{{ recruitmentTitle }}」
            </p>
            <p v-else class="text-gray-600 mb-6">
              参加者からの申請を待ちましょう
            </p>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <!-- View Recruitment -->
              <button
                @click="handleViewRecruitment"
                class="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <MdiIcon :path="mdiEye" :size="20" />
                募集を見る
              </button>

              <!-- Go Home -->
              <button
                @click="handleGoHome"
                class="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <MdiIcon :path="mdiHome" :size="20" />
                トップへ戻る
              </button>

              <!-- Create Another -->
              <button
                @click="handleCreateAnother"
                class="w-full flex items-center justify-center gap-2 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                <MdiIcon :path="mdiPlus" :size="18" />
                続けて作成
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
