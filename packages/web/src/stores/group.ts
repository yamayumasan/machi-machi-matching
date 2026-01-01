import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import { api } from '../lib/api'
import { useAuthStore } from './auth'

interface Category {
  id: string
  name: string
  icon: string
}

interface GroupMember {
  id: string
  nickname: string | null
  avatarUrl: string | null
  bio?: string | null
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

interface GroupRecruitment {
  id: string
  title: string
  description?: string | null
  datetime?: string | null
  datetimeFlex?: string | null
  location?: string | null
  category: Category
  creator?: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  }
}

interface LastMessage {
  id: string
  content: string
  senderId: string
  senderNickname: string | null
  createdAt: string
}

interface Group {
  id: string
  name: string
  recruitment: GroupRecruitment
  members: GroupMember[]
  lastMessage?: LastMessage | null
  unreadCount?: number
  myRole?: 'OWNER' | 'MEMBER'
  updatedAt: string
  createdAt?: string
}

interface Message {
  id: string
  content: string
  sender: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  }
  createdAt: string
  isOwn?: boolean
}

interface TypingUser {
  userId: string
  nickname: string
}

export const useGroupStore = defineStore('group', () => {
  // State
  const groups = ref<Group[]>([])
  const currentGroup = ref<Group | null>(null)
  const messages = ref<Message[]>([])
  const typingUsers = ref<TypingUser[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  // Socket connection
  const connectSocket = () => {
    if (socket.value?.connected) return

    const authStore = useAuthStore()
    const token = authStore.session?.accessToken

    if (!token) {
      console.error('No access token available')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    socket.value = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.value.on('connect', () => {
      console.log('Socket connected')
      isConnected.value = true
    })

    socket.value.on('disconnect', () => {
      console.log('Socket disconnected')
      isConnected.value = false
    })

    socket.value.on('new-message', ({ message }: { message: Message }) => {
      const authStore = useAuthStore()
      messages.value.push({
        ...message,
        isOwn: message.sender.id === authStore.user?.id,
      })
    })

    socket.value.on('user-typing', (data: TypingUser) => {
      const existing = typingUsers.value.find((u) => u.userId === data.userId)
      if (!existing) {
        typingUsers.value.push(data)
      }
    })

    socket.value.on('user-stop-typing', ({ userId }: { userId: string }) => {
      typingUsers.value = typingUsers.value.filter((u) => u.userId !== userId)
    })

    socket.value.on('user-joined', ({ nickname }: { userId: string; nickname: string }) => {
      console.log(`${nickname} joined the chat`)
    })

    socket.value.on('user-left', ({ nickname }: { userId: string; nickname: string }) => {
      console.log(`${nickname} left the chat`)
    })

    socket.value.on('error', ({ message }: { message: string }) => {
      console.error('Socket error:', message)
      error.value = message
    })
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  // Actions
  const fetchGroups = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Group[]>('/groups')

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch groups'
        return false
      }

      groups.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchGroup = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Group>(`/groups/${id}`)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch group'
        return false
      }

      currentGroup.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchMessages = async (groupId: string, before?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      if (before) queryParams.set('before', before)

      const endpoint = `/groups/${groupId}/messages${queryParams.toString() ? `?${queryParams}` : ''}`
      const response = await api.get<Message[]>(endpoint)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch messages'
        return false
      }

      if (before) {
        // 過去のメッセージを先頭に追加
        messages.value = [...response.data, ...messages.value]
      } else {
        messages.value = response.data
      }
      return true
    } finally {
      isLoading.value = false
    }
  }

  const createGroupFromRecruitment = async (recruitmentId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{ id: string; name: string }>(`/groups/create-from-recruitment/${recruitmentId}`, {})

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to create group'
        return null
      }

      return response.data
    } finally {
      isLoading.value = false
    }
  }

  const joinGroup = (groupId: string) => {
    if (!socket.value?.connected) {
      connectSocket()
    }
    socket.value?.emit('join-group', { groupId })
  }

  const leaveGroup = (groupId: string) => {
    socket.value?.emit('leave-group', { groupId })
    messages.value = []
    typingUsers.value = []
  }

  const sendMessage = (groupId: string, content: string) => {
    if (!socket.value?.connected) {
      error.value = 'Not connected to chat'
      return false
    }

    socket.value.emit('send-message', { groupId, content })
    return true
  }

  const sendMessageViaApi = async (groupId: string, content: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<Message>(`/groups/${groupId}/messages`, { content })

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to send message'
        return null
      }

      // API経由の場合はローカルに追加（Socketがない場合のフォールバック）
      if (!socket.value?.connected) {
        messages.value.push(response.data)
      }

      return response.data
    } finally {
      isLoading.value = false
    }
  }

  const startTyping = (groupId: string) => {
    socket.value?.emit('typing-start', { groupId })
  }

  const stopTyping = (groupId: string) => {
    socket.value?.emit('typing-end', { groupId })
  }

  const clearError = () => {
    error.value = null
  }

  const clearMessages = () => {
    messages.value = []
    typingUsers.value = []
  }

  // Computed
  const sortedGroups = computed(() =>
    [...groups.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  )

  return {
    // State
    groups,
    currentGroup,
    messages,
    typingUsers,
    isLoading,
    error,
    isConnected,
    // Computed
    sortedGroups,
    // Actions
    connectSocket,
    disconnectSocket,
    fetchGroups,
    fetchGroup,
    fetchMessages,
    createGroupFromRecruitment,
    joinGroup,
    leaveGroup,
    sendMessage,
    sendMessageViaApi,
    startTyping,
    stopTyping,
    clearError,
    clearMessages,
  }
})
