<script setup lang="ts">
import { ref, watch } from 'vue'
import MdiIcon from './MdiIcon.vue'
import UserAvatar from './UserAvatar.vue'
import { mdiCheckCircle, mdiHome, mdiPlus, mdiAccountGroup, mdiSend } from '../lib/icons'
import { api } from '../lib/api'

interface Suggestion {
  user: {
    id: string
    nickname: string
    avatarUrl: string | null
    bio?: string
  }
  score: number
  hasActiveWantToDo: boolean
  wantToDo?: {
    id: string
    comment: string
    timing: string
  }
  matchedCategories: string[]
}

interface Props {
  modelValue: boolean
  recruitmentId?: string
  recruitmentTitle?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  goHome: []
  createAnother: []
}>()

const suggestions = ref<Suggestion[]>([])
const isLoadingSuggestions = ref(false)
const sentOffers = ref<Set<string>>(new Set())

// モーダルが開いたらサジェストを取得
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.recruitmentId) {
    await fetchSuggestions()
  } else {
    sentOffers.value.clear()
  }
})

const fetchSuggestions = async () => {
  if (!props.recruitmentId) return

  isLoadingSuggestions.value = true
  try {
    const response = await api.get<Suggestion[]>(`/recruitments/${props.recruitmentId}/suggestions`)
    if (response.success && response.data) {
      suggestions.value = response.data
    }
  } catch (err) {
    console.error('Failed to fetch suggestions:', err)
  } finally {
    isLoadingSuggestions.value = false
  }
}

const sendOffer = async (userId: string) => {
  if (!props.recruitmentId || sentOffers.value.has(userId)) return

  try {
    const response = await api.post(`/recruitments/${props.recruitmentId}/offer`, {
      receiverId: userId,
      message: 'ぜひ参加しませんか？',
    })
    if (response.success) {
      sentOffers.value.add(userId)
    }
  } catch (err) {
    console.error('Failed to send offer:', err)
  }
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
        class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
            class="bg-white rounded-lg shadow-elevated p-6 w-full max-w-sm text-center"
          >
            <!-- Success Icon -->
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MdiIcon :path="mdiCheckCircle" :size="40" class="text-green-500" />
              </div>
            </div>

            <!-- Title -->
            <h2 class="text-xl font-semibold text-primary-900 mb-2">
              募集を作成しました！
            </h2>

            <!-- Recruitment Title -->
            <p v-if="recruitmentTitle" class="text-primary-600 mb-6">
              「{{ recruitmentTitle }}」
            </p>
            <p v-else class="text-primary-600 mb-6">
              参加者からの申請を待ちましょう
            </p>

            <!-- Suggestions Section（常に表示） -->
            <div class="mb-4">
              <div class="flex items-center justify-center mb-3">
                <h3 class="text-sm font-semibold text-primary-700 flex items-center gap-1">
                  <MdiIcon :path="mdiAccountGroup" :size="18" />
                  おすすめユーザー
                </h3>
              </div>

              <!-- Loading State -->
              <div v-if="isLoadingSuggestions" class="py-4 text-center">
                <div class="inline-block w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm text-primary-500 mt-2">読み込み中...</p>
              </div>

              <!-- No Suggestions -->
              <div v-else-if="suggestions.length === 0" class="py-3 text-center bg-primary-50 rounded-lg">
                <p class="text-sm text-primary-500">現在おすすめのユーザーはいません</p>
              </div>

              <!-- Suggestions List -->
              <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="suggestion in suggestions"
                  :key="suggestion.user.id"
                  class="flex items-center gap-3 p-2 bg-primary-50 rounded-lg"
                >
                  <UserAvatar
                    :src="suggestion.user.avatarUrl"
                    :name="suggestion.user.nickname"
                    size="md"
                  />
                  <div class="flex-1 min-w-0 text-left">
                    <p class="text-sm font-medium text-primary-900 truncate">
                      {{ suggestion.user.nickname }}
                    </p>
                    <p v-if="suggestion.wantToDo" class="text-xs text-primary-500 truncate">
                      {{ suggestion.wantToDo.comment || 'やりたいこと表明中' }}
                    </p>
                    <div v-if="suggestion.matchedCategories.length > 0" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="cat in suggestion.matchedCategories.slice(0, 2)"
                        :key="cat"
                        class="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded"
                      >
                        {{ cat }}
                      </span>
                    </div>
                  </div>
                  <button
                    v-if="!sentOffers.has(suggestion.user.id)"
                    @click="sendOffer(suggestion.user.id)"
                    class="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-primary-900 text-white text-xs font-medium rounded hover:bg-primary-800 transition-colors"
                  >
                    <MdiIcon :path="mdiSend" :size="14" />
                    誘う
                  </button>
                  <span
                    v-else
                    class="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                  >
                    <MdiIcon :path="mdiCheckCircle" :size="14" />
                    送信済
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <!-- Go Home -->
              <button
                @click="handleGoHome"
                class="w-full flex items-center justify-center gap-2 py-3 bg-primary-900 text-white rounded font-medium hover:bg-primary-800 transition-colors"
              >
                <MdiIcon :path="mdiHome" :size="20" />
                トップへ戻る
              </button>

              <!-- Create Another -->
              <button
                @click="handleCreateAnother"
                class="w-full flex items-center justify-center gap-2 py-2 text-primary-700 font-medium hover:text-primary-900 transition-colors"
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
