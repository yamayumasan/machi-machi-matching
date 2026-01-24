import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL, SUPABASE_URL } from '@/constants'

// エラーコードの定義
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// Axios インスタンス
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
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
    if (__DEV__) {
      console.log('[API] Request:', config.method?.toUpperCase(), config.url)
    }
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
    if (__DEV__) {
      console.log('[API] Response:', response.status, response.config.url)
    }
    return response
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      console.log('[API] Error:', error.response?.status, error.config?.url, error.response?.data)
    }

    // ネットワークエラーの場合
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.log('[API] Request timeout')
      } else {
        console.log('[API] Network error - no response received')
      }
    }

    // 認証エラーの場合
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized - session may be expired')
    }

    return Promise.reject(error)
  }
)

// エラーコード判定
export const getErrorCode = (error: unknown): ErrorCode => {
  if (!axios.isAxiosError(error)) {
    return ErrorCodes.UNKNOWN
  }

  const axiosError = error as AxiosError

  // ネットワークエラー
  if (!axiosError.response) {
    if (axiosError.code === 'ECONNABORTED') {
      return ErrorCodes.TIMEOUT
    }
    return ErrorCodes.NETWORK_ERROR
  }

  // HTTPステータスコードによる分類
  const status = axiosError.response.status
  if (status === 401) return ErrorCodes.UNAUTHORIZED
  if (status === 404) return ErrorCodes.NOT_FOUND
  if (status >= 500) return ErrorCodes.SERVER_ERROR

  return ErrorCodes.UNKNOWN
}

// エラーメッセージ抽出
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>

    // ネットワークエラー
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return 'リクエストがタイムアウトしました。もう一度お試しください。'
      }
      return 'ネットワークに接続できません。接続を確認してください。'
    }

    // サーバーからのエラーメッセージ
    const serverMessage =
      axiosError.response?.data?.message || axiosError.response?.data?.error

    if (serverMessage) {
      return serverMessage
    }

    // HTTPステータスコードによるデフォルトメッセージ
    const status = axiosError.response.status
    if (status === 401) return '認証が必要です。再度ログインしてください。'
    if (status === 403) return 'この操作を行う権限がありません。'
    if (status === 404) return 'リソースが見つかりませんでした。'
    if (status >= 500) return 'サーバーエラーが発生しました。しばらくしてからお試しください。'

    return axiosError.message || 'エラーが発生しました'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'エラーが発生しました'
}

// リトライ可能なエラーかどうかを判定
export const isRetryableError = (error: unknown): boolean => {
  const code = getErrorCode(error)
  return code === ErrorCodes.NETWORK_ERROR || code === ErrorCodes.TIMEOUT || code === ErrorCodes.SERVER_ERROR
}
