import { api } from './api'

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE_CONTENT'
  | 'FAKE_PROFILE'
  | 'OFFENSIVE_LANGUAGE'
  | 'OTHER'

export type ReportTarget = 'USER' | 'RECRUITMENT' | 'MESSAGE'

export interface ReportData {
  reportedUserId: string
  targetType: ReportTarget
  targetId?: string
  reason: ReportReason
  description?: string
}

export interface BlockedUser {
  id: string
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  }
  createdAt: string
}

export interface BlockStatus {
  isBlocked: boolean
  isBlockedBy: boolean
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

// 報告を送信
export const reportUser = async (data: ReportData): Promise<{ message: string }> => {
  const response = await api.post<ApiResponse<{ id: string; message: string }>>(
    '/moderation/reports',
    data
  )
  return response.data.data
}

// ユーザーをブロック
export const blockUser = async (userId: string): Promise<void> => {
  await api.post<ApiResponse<{ message: string }>>('/moderation/blocks', {
    userId,
  })
}

// ブロック解除
export const unblockUser = async (userId: string): Promise<void> => {
  await api.delete<void>(`/moderation/blocks/${userId}`)
}

// ブロックリスト取得
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const response = await api.get<ApiResponse<BlockedUser[]>>('/moderation/blocks')
  return response.data.data
}

// 特定ユーザーのブロック状態を確認
export const getBlockStatus = async (userId: string): Promise<BlockStatus> => {
  const response = await api.get<ApiResponse<BlockStatus>>(
    `/moderation/blocks/${userId}/status`
  )
  return response.data.data
}

// 報告理由の表示名
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'スパム・宣伝',
  HARASSMENT: 'ハラスメント・嫌がらせ',
  INAPPROPRIATE_CONTENT: '不適切なコンテンツ',
  FAKE_PROFILE: '偽のプロフィール',
  OFFENSIVE_LANGUAGE: '攻撃的な言葉遣い',
  OTHER: 'その他',
}
