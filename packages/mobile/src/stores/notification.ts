import { create } from 'zustand'
import {
  Notification,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/services/notification'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  total: number

  // Actions
  fetchNotifications: (page?: number) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  clearError: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  total: 0,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const { notifications, total } = await getNotifications({ page, limit: 20 })
      const unreadCount = notifications.filter((n) => !n.isRead).length
      set({ notifications, total, unreadCount, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || '通知の取得に失敗しました',
        isLoading: false,
      })
    }
  },

  markAsRead: async (id: string) => {
    await markAsRead(id)
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    )
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
  },

  markAllAsRead: async () => {
    await markAllAsRead()
    const notifications = get().notifications.map((n) => ({ ...n, isRead: true }))
    set({ notifications, unreadCount: 0 })
  },

  addNotification: (notification: Notification) => {
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: get().unreadCount + (notification.isRead ? 0 : 1),
    })
  },

  clearError: () => set({ error: null }),
}))
