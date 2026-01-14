import { api } from './api'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export type WantToDoTiming = 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'ANYTIME'
export type WantToDoStatus = 'ACTIVE' | 'EXPIRED' | 'DELETED'

export interface WantToDo {
  id: string
  userId: string
  categoryId: string
  timing: WantToDoTiming
  comment: string | null
  latitude: number | null
  longitude: number | null
  landmarkName: string | null
  status: WantToDoStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    icon: string
  }
  user?: {
    id: string
    nickname: string
    avatar: string | null
  }
}

export interface CreateWantToDoData {
  categoryId: string
  timing: WantToDoTiming
  comment?: string
  latitude?: number
  longitude?: number
  landmarkName?: string
}

// 自分のやりたいこと一覧取得
export const getWantToDos = async (): Promise<WantToDo[]> => {
  const response = await api.get<ApiResponse<WantToDo[]>>('/want-to-dos/me')
  return response.data.data || []
}

// やりたいこと作成
export const createWantToDo = async (data: CreateWantToDoData): Promise<WantToDo> => {
  const response = await api.post<ApiResponse<WantToDo>>('/want-to-dos', data)
  return response.data.data
}

// やりたいこと更新
export const updateWantToDo = async (
  id: string,
  data: Partial<CreateWantToDoData>
): Promise<WantToDo> => {
  const response = await api.put<ApiResponse<WantToDo>>(`/want-to-dos/${id}`, data)
  return response.data.data
}

// やりたいこと削除
export const deleteWantToDo = async (id: string): Promise<void> => {
  await api.delete(`/want-to-dos/${id}`)
}

// やりたいこと延長
export const extendWantToDo = async (id: string): Promise<WantToDo> => {
  const response = await api.put<ApiResponse<WantToDo>>(`/want-to-dos/${id}`, {})
  return response.data.data
}
