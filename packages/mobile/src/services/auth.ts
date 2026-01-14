import { api, getErrorMessage } from './api'

export interface User {
  id: string
  email: string
  nickname: string | null
  avatar: string | null
  bio: string | null
  area: 'TOKYO' | 'SENDAI' | null
  latitude: number | null
  longitude: number | null
  isOnboarded: boolean
  interests?: { id: string; name: string; icon: string }[]
}

export interface OnboardingData {
  nickname: string
  bio?: string
  area: 'TOKYO' | 'SENDAI'
  categoryIds: string[]
  latitude?: number
  longitude?: number
}

// APIレスポンスの型
interface ApiResponse<T> {
  success: boolean
  data: T
}

// 現在のユーザー情報を取得
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<ApiResponse<{ user: User }>>('/auth/me')
  return response.data.data.user
}

// OAuth認証後にユーザーをDBに登録/取得
export const registerOAuthUser = async (
  accessToken: string,
  refreshToken: string
): Promise<User> => {
  console.log('[AUTH SERVICE] registerOAuthUser: calling /auth/oauth/callback')
  console.log('[AUTH SERVICE] accessToken prefix:', accessToken?.substring(0, 20))
  console.log('[AUTH SERVICE] refreshToken exists:', !!refreshToken)
  const response = await api.post<ApiResponse<{ user: User }>>(
    '/auth/oauth/callback',
    {
      accessToken,
      refreshToken,
    }
  )
  console.log('[AUTH SERVICE] registerOAuthUser: response:', response.data)
  return response.data.data.user
}

// オンボーディング完了
export const completeOnboarding = async (data: OnboardingData): Promise<User> => {
  const response = await api.post<ApiResponse<User>>('/users/me/onboarding', data)
  return response.data.data
}

// ユーザー情報更新
export const updateUser = async (
  data: Partial<Pick<User, 'nickname' | 'bio' | 'area' | 'avatar'>>
): Promise<User> => {
  const response = await api.put<ApiResponse<User>>('/users/me', data)
  return response.data.data
}

// ユーザーのカテゴリ更新
export const updateUserCategories = async (categoryIds: string[]): Promise<void> => {
  await api.put<ApiResponse<unknown>>('/users/me/categories', { categoryIds })
}

export { getErrorMessage }
