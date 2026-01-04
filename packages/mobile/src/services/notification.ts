import { api } from './api'

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

// 通知一覧取得
export const getNotifications = async (params?: {
  page?: number
  limit?: number
}): Promise<{ notifications: Notification[]; total: number }> => {
  const response = await api.get('/notifications', { params })
  return response.data
}

// 通知を既読にする
export const markAsRead = async (id: string): Promise<Notification> => {
  const response = await api.put<Notification>(`/notifications/${id}/read`)
  return response.data
}

// 全て既読にする
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all')
}
