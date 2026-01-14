import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL, SUPABASE_URL } from '@/constants'

// Axios インスタンス
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Supabaseのストレージキーを生成
const getSupabaseStorageKey = () => {
  // Supabase URLからproject refを抽出: https://xxx.supabase.co -> xxx
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)
  const projectRef = match ? match[1] : 'default'
  return `sb-${projectRef}-auth-token`
}

// トークン取得
const getAccessToken = async (): Promise<string | null> => {
  try {
    const storageKey = getSupabaseStorageKey()
    const session = await SecureStore.getItemAsync(storageKey)
    if (session) {
      const parsed = JSON.parse(session)
      return parsed.access_token || null
    }
    return null
  } catch (error) {
    console.log('getAccessToken error:', error)
    return null
  }
}

// リクエストインターセプター: 認証ヘッダー追加
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken()
    console.log('[API] Request:', config.method?.toUpperCase(), config.url)
    console.log('[API] Token exists:', !!token, token ? `(${token.substring(0, 20)}...)` : '')
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
  (response) => {
    console.log('[API] Response:', response.status, response.config.url)
    return response
  },
  async (error: AxiosError) => {
    console.log('[API] Error:', error.response?.status, error.config?.url, error.response?.data)
    if (error.response?.status === 401) {
      // トークン期限切れの場合、セッションをクリア
      // 認証ストアで再ログインを促す
      console.log('[API] Unauthorized - session may be expired')
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
