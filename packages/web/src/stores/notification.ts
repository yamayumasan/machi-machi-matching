import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'
import type { NotificationType } from '@machi/shared'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

interface NotificationResponse {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

interface PaginatedNotifications {
  items?: NotificationResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Computed
  const hasUnread = computed(() => unreadCount.value > 0)

  // Actions
  const fetchNotifications = async (page = 1, unreadOnly = false) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        unreadOnly: unreadOnly.toString(),
      })

      const response = await api.get<NotificationResponse[] | PaginatedNotifications>(
        `/notifications?${params}`
      )

      if (!response.success) {
        error.value = response.error?.message || 'Failed to fetch notifications'
        return false
      }

      // Handle both array response and paginated response
      if (Array.isArray(response.data)) {
        notifications.value = response.data as Notification[]
      } else if (response.data) {
        const data = response.data as PaginatedNotifications
        if (data.items) {
          notifications.value = data.items as Notification[]
        } else {
          // Direct array in data field
          notifications.value = response.data as unknown as Notification[]
        }
        if (data.pagination) {
          pagination.value = data.pagination
        }
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<{ count: number }>('/notifications/unread-count')

      if (response.success && response.data) {
        unreadCount.value = response.data.count
      }
    } catch {
      // Silently fail
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await api.post<{ id: string; isRead: boolean }>(
        `/notifications/${notificationId}/read`
      )

      if (response.success) {
        const notification = notifications.value.find((n) => n.id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await api.post<{ updatedCount: number }>('/notifications/read-all')

      if (response.success) {
        notifications.value.forEach((n) => {
          n.isRead = true
        })
        unreadCount.value = 0
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`)

      if (response.success) {
        const index = notifications.value.findIndex((n) => n.id === notificationId)
        if (index !== -1) {
          const notification = notifications.value[index]
          if (!notification.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
          notifications.value.splice(index, 1)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const clearNotifications = () => {
    notifications.value = []
    unreadCount.value = 0
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    }
  }

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    pagination,
    // Computed
    hasUnread,
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  }
})
