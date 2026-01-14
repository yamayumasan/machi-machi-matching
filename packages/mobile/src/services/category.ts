import { api } from './api'

export interface Category {
  id: string
  name: string
  icon: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

// カテゴリ一覧取得
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<ApiResponse<Category[]>>('/categories')
  return response.data.data || []
}
