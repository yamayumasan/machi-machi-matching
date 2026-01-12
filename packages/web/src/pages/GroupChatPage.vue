<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGroupStore } from '../stores/group'
import UserAvatar from '../components/UserAvatar.vue'

const router = useRouter()
const route = useRoute()
const groupStore = useGroupStore()

const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const showGroupInfo = ref(false)
const typingTimeout = ref<NodeJS.Timeout | null>(null)

const isLoading = computed(() => groupStore.isLoading)
const group = computed(() => groupStore.currentGroup)
const messages = computed(() => groupStore.messages)
const typingUsers = computed(() => groupStore.typingUsers)
const isConnected = computed(() => groupStore.isConnected)

const groupId = computed(() => route.params.id as string)

onMounted(async () => {
  // Socket接続
  groupStore.connectSocket()

  // グループ情報とメッセージを取得
  await Promise.all([
    groupStore.fetchGroup(groupId.value),
    groupStore.fetchMessages(groupId.value),
  ])

  // グループに参加
  groupStore.joinGroup(groupId.value)

  // スクロール
  scrollToBottom()
})

onUnmounted(() => {
  groupStore.leaveGroup(groupId.value)
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
  groupStore.startTyping(groupId.value)

  // 一定時間後に入力終了を通知
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  typingTimeout.value = setTimeout(() => {
    groupStore.stopTyping(groupId.value)
  }, 2000)
}

const sendMessage = async () => {
  const content = messageInput.value.trim()
  if (!content) return

  // 入力中通知を停止
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  groupStore.stopTyping(groupId.value)

  // Socket経由で送信
  if (isConnected.value) {
    groupStore.sendMessage(groupId.value, content)
  } else {
    // フォールバック：API経由で送信
    await groupStore.sendMessageViaApi(groupId.value, content)
  }

  messageInput.value = ''
}

const goBack = () => {
  router.push('/groups')
}
</script>

<template>
  <div class="h-screen flex flex-col bg-primary-100">
    <!-- Header -->
    <header class="bg-white border-b border-primary-200 flex-shrink-0">
      <div class="container mx-auto px-4 py-3 flex items-center gap-4">
        <button @click="goBack" class="text-primary-500 hover:text-primary-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1 min-w-0" @click="showGroupInfo = true">
          <h1 class="font-semibold text-primary-900 truncate">{{ group?.name || 'グループチャット' }}</h1>
          <p class="text-xs text-primary-500">{{ group?.members.length || 0 }}人のメンバー</p>
        </div>

        <button @click="showGroupInfo = true" class="text-primary-500 hover:text-primary-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <!-- Loading -->
      <div v-if="isLoading && messages.length === 0" class="flex justify-center py-8">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="messages.length === 0" class="text-center py-8">
        <p class="text-primary-500">まだメッセージはありません</p>
        <p class="text-sm text-primary-400 mt-1">最初のメッセージを送ってみましょう！</p>
      </div>

      <!-- Messages -->
      <template v-else>
        <template v-for="(message, index) in messages" :key="message.id">
          <!-- Date separator -->
          <div v-if="shouldShowDate(index)" class="flex justify-center">
            <span class="px-3 py-1 bg-primary-200 rounded-full text-xs text-primary-600">
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
            />

            <!-- Message content -->
            <div :class="['max-w-[70%]', message.isOwn ? 'items-end' : 'items-start']">
              <p v-if="!message.isOwn" class="text-xs text-primary-500 mb-1 ml-1">
                {{ message.sender.nickname }}
              </p>
              <div
                :class="[
                  'px-4 py-2 rounded-2xl break-words',
                  message.isOwn
                    ? 'bg-accent-600 text-white rounded-br-sm'
                    : 'bg-white text-primary-900 rounded-bl-sm border border-primary-100',
                ]"
              >
                <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
              </div>
              <p
                :class="[
                  'text-xs text-primary-400 mt-1',
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
      <div v-if="typingUsers.length > 0" class="flex items-center gap-2 text-sm text-primary-500">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
        <span>{{ typingUsers.map((u) => u.nickname).join(', ') }}が入力中...</span>
      </div>
    </div>

    <!-- Input -->
    <div class="bg-white border-t border-primary-200 flex-shrink-0 p-3">
      <form @submit.prevent="sendMessage" class="flex items-center gap-2">
        <input
          v-model="messageInput"
          type="text"
          placeholder="メッセージを入力..."
          class="flex-1 px-4 py-2 text-base border border-primary-200 rounded-full focus:ring-1 focus:ring-primary-700 focus:border-primary-400"
          @input="handleInput"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          class="p-2 bg-primary-900 text-white rounded-full hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>

    <!-- Group Info Modal -->
    <Teleport to="body">
      <div
        v-if="showGroupInfo && group"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showGroupInfo = false"
      >
        <div class="bg-white rounded-lg shadow-elevated w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-primary-900">グループ情報</h3>
              <button @click="showGroupInfo = false" class="text-primary-400 hover:text-primary-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Group details -->
            <div class="mb-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <span class="text-2xl">{{ group.recruitment.category.icon }}</span>
                </div>
                <div>
                  <h4 class="font-semibold text-primary-900">{{ group.name }}</h4>
                  <p class="text-sm text-primary-500">{{ group.recruitment.category.name }}</p>
                </div>
              </div>

              <div v-if="group.recruitment.datetime || group.recruitment.datetimeFlex" class="text-sm text-primary-600 mb-2">
                <span class="font-medium">日時:</span>
                {{
                  group.recruitment.datetime
                    ? new Date(group.recruitment.datetime).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : group.recruitment.datetimeFlex
                }}
              </div>

              <div v-if="group.recruitment.location" class="text-sm text-primary-600">
                <span class="font-medium">場所:</span> {{ group.recruitment.location }}
              </div>
            </div>

            <!-- Members -->
            <div>
              <h4 class="font-medium text-primary-700 mb-3">メンバー ({{ group.members.length }})</h4>
              <div class="space-y-3">
                <div
                  v-for="member in group.members"
                  :key="member.id"
                  class="flex items-center gap-3"
                >
                  <UserAvatar :src="member.avatarUrl" :name="member.nickname" size="md" />
                  <div class="flex-1">
                    <p class="font-medium text-primary-900">
                      {{ member.nickname }}
                      <span v-if="member.role === 'OWNER'" class="text-xs text-accent-600 ml-1">(主催)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
