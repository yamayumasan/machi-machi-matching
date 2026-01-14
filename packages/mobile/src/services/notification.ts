import { api } from './api'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export type NotificationType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'RECRUITMENT_MATCH'
  | 'GROUP_CREATED'
  | 'NEW_MESSAGE'
  | 'MEMBER_JOINED'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

interface NotificationsResponse {
  success: boolean
  data: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 通知一覧取得
export const getNotifications = async (params?: {
  page?: number
  limit?: number
}): Promise<{ notifications: Notification[]; total: number }> => {
  const response = await api.get<NotificationsResponse>('/notifications', { params })
  return {
    notifications: response.data.data || [],
    total: response.data.pagination?.total || 0,
  }
}

// 通知を既読にする
export const markAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`)
}

// 全て既読にする
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all')
}
