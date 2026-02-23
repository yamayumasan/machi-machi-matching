export * from './theme'

// 環境設定からインポート
import { config } from '@/config/env'

// API URL（環境自動判別）
export const API_URL = config.apiUrl

// Supabase
export const SUPABASE_URL = config.supabaseUrl
export const SUPABASE_ANON_KEY = config.supabaseAnonKey
