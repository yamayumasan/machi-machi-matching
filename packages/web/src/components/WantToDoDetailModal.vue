<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWantToDoStore } from '../stores/wantToDo'
import { useAuthStore } from '../stores/auth'
import { AREA_LABELS, TIMING_LABELS, type Timing } from '@machi/shared'
import ModalSheet from './ModalSheet.vue'
import MdiIcon from './MdiIcon.vue'
import UserAvatar from './UserAvatar.vue'
import { getIconPath, mdiClock, mdiMapMarker, mdiSend } from '../lib/icons'

interface Props {
  modelValue: boolean
  wantToDoId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const wantToDoStore = useWantToDoStore()
const authStore = useAuthStore()

const message = ref('')
const isSending = ref(false)

const isLoading = computed(() => wantToDoStore.isLoading)
const wantToDo = computed(() => wantToDoStore.currentWantToDo)
const error = computed(() => wantToDoStore.error)
const currentUserId = computed(() => authStore.user?.id)

// モーダルが開いたらデータを取得
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.wantToDoId) {
      await wantToDoStore.fetchWantToDo(props.wantToDoId)
    }
    if (!isOpen) {
      message.value = ''
    }
  },
  { immediate: true }
)

// IDが変わったらデータを再取得
watch(
  () => props.wantToDoId,
  async (newId) => {
    if (props.modelValue && newId) {
      await wantToDoStore.fetchWantToDo(newId)
    }
  }
)

const getTimingLabel = (timing: string) => {
  return TIMING_LABELS[timing as Timing] || timing
}

const formatExpiresAt = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return '期限切れ'
  } else if (diffDays === 1) {
    return '明日まで'
  } else if (diffDays <= 7) {
    return `あと${diffDays}日`
  } else {
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
    })
  }
}

const handleSendMessage = async () => {
  if (!message.value.trim() || !wantToDo.value) return

  isSending.value = true
  try {
    // TODO: メッセージ送信APIを実装
    console.log('Send message:', message.value, 'to:', wantToDo.value.user?.id)

    // 仮の成功処理
    alert('メッセージ機能は準備中です')
    message.value = ''
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <ModalSheet
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="表明の詳細"
    max-width="2xl"
    :fullscreen="true"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-primary-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 px-4">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="wantToDo" class="p-4 space-y-4">
      <!-- User Info Section -->
      <div class="flex items-center gap-4 p-4 bg-primary-50 rounded-lg">
        <UserAvatar
          :src="wantToDo.user?.avatarUrl"
          :name="wantToDo.user?.nickname"
          size="xl"
        />
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-primary-900 truncate">{{ wantToDo.user?.nickname || '匿名' }}</h2>
          <div class="flex items-center gap-2 text-sm text-primary-500 mt-1">
            <MdiIcon :path="mdiMapMarker" :size="14" />
            <span>{{ AREA_LABELS[wantToDo.user?.area as keyof typeof AREA_LABELS] || wantToDo.user?.area || '未設定' }}</span>
          </div>
          <p v-if="wantToDo.user?.bio" class="text-primary-600 text-sm mt-2 line-clamp-2">
            {{ wantToDo.user.bio }}
          </p>
        </div>
      </div>

      <!-- WantToDo Info -->
      <div class="border border-primary-200 rounded-lg p-4 space-y-3">
        <!-- Category -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
            <MdiIcon :path="getIconPath(wantToDo.category.icon)" :size="28" class="text-accent-600" />
          </div>
          <div>
            <p class="text-sm text-primary-500">やりたいこと</p>
            <p class="text-lg font-semibold text-primary-900">{{ wantToDo.category.name }}</p>
          </div>
        </div>

        <!-- Timing & Expiry -->
        <div class="flex flex-wrap gap-3 pt-2 border-t border-primary-100">
          <div class="flex items-center gap-2 text-sm">
            <MdiIcon :path="mdiClock" :size="16" class="text-primary-400" />
            <span class="text-primary-600">希望時期:</span>
            <span class="font-medium text-primary-900">{{ getTimingLabel(wantToDo.timing) }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-primary-600">有効期限:</span>
            <span
              :class="[
                'font-medium',
                new Date(wantToDo.expiresAt) <= new Date() ? 'text-red-500' : 'text-primary-700'
              ]"
            >
              {{ formatExpiresAt(wantToDo.expiresAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Comment -->
      <div v-if="wantToDo.comment" class="border-t border-primary-100 pt-4">
        <h3 class="text-sm font-medium text-primary-500 mb-2">コメント</h3>
        <p class="text-primary-800 whitespace-pre-wrap text-sm bg-primary-50 rounded-lg p-3">
          {{ wantToDo.comment }}
        </p>
      </div>

      <!-- Owner View -->
      <div v-if="wantToDo.isOwner" class="bg-blue-50 rounded-lg p-4 text-center">
        <p class="text-blue-700 text-sm">これはあなたの表明です</p>
      </div>
    </div>

    <template #footer>
      <!-- Message Input (for non-owners) -->
      <div v-if="wantToDo && !wantToDo.isOwner && wantToDo.user?.id !== currentUserId" class="p-4 border-t border-primary-100">
        <div class="flex gap-2">
          <input
            v-model="message"
            type="text"
            placeholder="メッセージを送る..."
            class="flex-1 px-4 py-3 text-base border border-primary-200 rounded focus:ring-1 focus:ring-primary-700 focus:border-primary-400"
            @keydown.enter.prevent="handleSendMessage"
          />
          <button
            @click="handleSendMessage"
            :disabled="!message.trim() || isSending"
            class="px-4 py-3 bg-primary-900 text-white rounded hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MdiIcon :path="mdiSend" :size="20" />
          </button>
        </div>
        <p class="text-xs text-primary-400 mt-2 text-center">
          メッセージを送って一緒に活動しましょう
        </p>
      </div>

      <!-- Owner actions -->
      <div v-else-if="wantToDo?.isOwner" class="p-4">
        <button
          @click="emit('update:modelValue', false)"
          class="w-full py-3 border border-primary-200 rounded font-medium hover:bg-primary-50 transition-colors text-primary-700"
        >
          閉じる
        </button>
      </div>
    </template>
  </ModalSheet>
</template>
