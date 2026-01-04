<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useGroupStore } from '../stores/group'
import UserAvatar from './UserAvatar.vue'
import MdiIcon from './MdiIcon.vue'
import { mdiSend } from '../lib/icons'

interface Props {
  groupId: string
}

const props = defineProps<Props>()

const groupStore = useGroupStore()

const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const typingTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const isLoading = computed(() => groupStore.isLoading)
const messages = computed(() => groupStore.messages)
const typingUsers = computed(() => groupStore.typingUsers)
const isConnected = computed(() => groupStore.isConnected)

onMounted(async () => {
  // Socket接続
  groupStore.connectSocket()

  // メッセージを取得
  await groupStore.fetchMessages(props.groupId)

  // グループに参加
  groupStore.joinGroup(props.groupId)

  // スクロール
  scrollToBottom()
})

onUnmounted(() => {
  groupStore.leaveGroup(props.groupId)
  groupStore.clearMessages()
})

// メッセージが追加されたらスクロール
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

const shouldShowDate = (index: number) => {
  if (index === 0) return true
  const currentDate = new Date(messages.value[index].createdAt).toDateString()
  const prevDate = new Date(messages.value[index - 1].createdAt).toDateString()
  return currentDate !== prevDate
}

const handleInput = () => {
  // 入力中通知
  groupStore.startTyping(props.groupId)

  // 一定時間後に入力終了を通知
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  typingTimeout.value = setTimeout(() => {
    groupStore.stopTyping(props.groupId)
  }, 2000)
}

const sendMessage = async () => {
  const content = messageInput.value.trim()
  if (!content) return

  // 入力中通知を停止
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  groupStore.stopTyping(props.groupId)

  // Socket経由で送信
  if (isConnected.value) {
    groupStore.sendMessage(props.groupId, content)
  } else {
    // フォールバック：API経由で送信
    await groupStore.sendMessageViaApi(props.groupId, content)
  }

  messageInput.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-3 space-y-3"
    >
      <!-- Loading -->
      <div v-if="isLoading && messages.length === 0" class="flex justify-center py-6">
        <svg class="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="messages.length === 0" class="text-center py-6">
        <p class="text-gray-500 text-sm">まだメッセージはありません</p>
        <p class="text-xs text-gray-400 mt-1">メッセージを送ってみましょう</p>
      </div>

      <!-- Messages -->
      <template v-else>
        <template v-for="(message, index) in messages" :key="message.id">
          <!-- Date separator -->
          <div v-if="shouldShowDate(index)" class="flex justify-center">
            <span class="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
              {{ formatDate(message.createdAt) }}
            </span>
          </div>

          <!-- Message bubble -->
          <div
            :class="[
              'flex gap-2',
              message.isOwn ? 'flex-row-reverse' : 'flex-row',
            ]"
          >
            <!-- Avatar (for others) -->
            <UserAvatar
              v-if="!message.isOwn"
              :src="message.sender.avatarUrl"
              :name="message.sender.nickname"
              size="sm"
              class="flex-shrink-0"
            />

            <!-- Message content -->
            <div :class="['max-w-[75%]', message.isOwn ? 'items-end' : 'items-start']">
              <p v-if="!message.isOwn" class="text-xs text-gray-500 mb-0.5 ml-1">
                {{ message.sender.nickname }}
              </p>
              <div
                :class="[
                  'px-3 py-2 rounded-2xl break-words',
                  message.isOwn
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm',
                ]"
              >
                <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
              </div>
              <p
                :class="[
                  'text-xs text-gray-400 mt-0.5',
                  message.isOwn ? 'text-right mr-1' : 'ml-1',
                ]"
              >
                {{ formatTime(message.createdAt) }}
              </p>
            </div>
          </div>
        </template>
      </template>

      <!-- Typing indicator -->
      <div v-if="typingUsers.length > 0" class="flex items-center gap-2 text-xs text-gray-500">
        <div class="flex space-x-1">
          <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
        <span>{{ typingUsers.map((u) => u.nickname).join(', ') }}が入力中...</span>
      </div>
    </div>

    <!-- Input -->
    <div class="bg-white border-t p-2">
      <form @submit.prevent="sendMessage" class="flex items-center gap-2">
        <input
          v-model="messageInput"
          type="text"
          placeholder="メッセージを入力..."
          class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          @input="handleInput"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          class="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MdiIcon :path="mdiSend" :size="18" />
        </button>
      </form>
    </div>
  </div>
</template>
