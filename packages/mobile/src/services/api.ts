import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from '@/constants'

// Axios インスタンス
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// トークン取得
const getAccessToken = async (): Promise<string | null> => {
  try {
    const session = await SecureStore.getItemAsync('supabase-session')
    if (session) {
      const parsed = JSON.parse(session)
      return parsed.access_token || null
    }
    return null
  } catch {
    return null
  }
}

// リクエストインターセプター: 認証ヘッダー追加
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// レスポンスインターセプター: エラーハンドリング
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // トークン期限切れの場合、セッションをクリア
      // 認証ストアで再ログインを促す
      console.log('Unauthorized - session may be expired')
    }
    return Promise.reject(error)
  }
)

// エラーメッセージ抽出
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'エラーが発生しました'
    )
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'エラーが発生しました'
}
