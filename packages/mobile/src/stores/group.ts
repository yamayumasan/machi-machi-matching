import { create } from 'zustand'
import {
  Group,
  Message,
  getGroups,
  getGroup,
  getMessages,
  sendMessage,
} from '@/services/group'

interface GroupState {
  groups: Group[]
  currentGroup: Group | null
  messages: Message[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchGroups: () => Promise<void>
  fetchGroup: (id: string) => Promise<void>
  fetchMessages: (groupId: string) => Promise<void>
  sendMessage: (groupId: string, content: string) => Promise<void>
  addMessage: (message: Message) => void
  clearError: () => void
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null })
    try {
      const groups = await getGroups()
      set({ groups, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'グループの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  fetchGroup: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const group = await getGroup(id)
      set({ currentGroup: group, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'グループの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  fetchMessages: async (groupId: string) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await getMessages(groupId)
      set({ messages, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'メッセージの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  sendMessage: async (groupId: string, content: string) => {
    const message = await sendMessage(groupId, content)
    set({ messages: [...get().messages, message] })
  },

  addMessage: (message: Message) => {
    set({ messages: [...get().messages, message] })
  },

  clearError: () => set({ error: null }),
}))
