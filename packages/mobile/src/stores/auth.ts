import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { createClient, Session } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants'
import {
  getCurrentUser,
  completeOnboarding as completeOnboardingApi,
  registerOAuthUser,
  User,
  OnboardingData,
} from '@/services/auth'

// WebBrowserの完了ハンドリングを有効化
WebBrowser.maybeCompleteAuthSession()

// Supabase クライアント
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: async (key) => {
        return await SecureStore.getItemAsync(key)
      },
      setItem: async (key, value) => {
        await SecureStore.setItemAsync(key, value)
      },
      removeItem: async (key) => {
        await SecureStore.deleteItemAsync(key)
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isOnboarded: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  fetchUser: () => Promise<void>
  completeOnboarding: (data: OnboardingData) => Promise<void>
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isOnboarded: false,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    set({ session: data.session })
    await get().fetchUser()
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    // メール確認が必要な場合、session は null
    if (data.session) {
      set({ session: data.session })
      await get().fetchUser()
    }
  },

  signInWithGoogle: async () => {
    // リダイレクトURLを作成
    // preferLocalhost: falseでexp://スキームを優先
    // Expo Goでの開発中はproxyを使用することで、Supabase Site URLの制約を回避
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'machi-machi',
      path: 'auth/callback',
      preferLocalhost: false,
    })

    // デバッグ用：実際のリダイレクトURLを確認
    console.log('Redirect URL:', redirectUrl)
    console.log('Platform:', require('react-native').Platform.OS)

    // SupabaseのGoogle OAuth URLを取得
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      throw error
    }

    if (!data.url) {
      throw new Error('OAuth URLの取得に失敗しました')
    }

    // デバッグ用：OAuth URLを確認（redirect_toパラメータが正しいか）
    console.log('OAuth URL:', data.url)

    // URLからredirect_toパラメータを抽出して確認
    const oauthUrl = new URL(data.url)
    console.log('redirect_to in OAuth URL:', oauthUrl.searchParams.get('redirect_to'))

    // ブラウザでOAuth認証を開始
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl,
      {
        showInRecents: true,
      }
    )

    if (result.type === 'success') {
      // URLからアクセストークンを取得
      const url = new URL(result.url)
      const params = new URLSearchParams(url.hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        // セッションを設定
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          throw sessionError
        }

        set({ session: sessionData.session })

        // バックエンドにOAuthコールバックを通知してDBにユーザーを作成/取得
        try {
          const user = await registerOAuthUser(accessToken, refreshToken)
          set({
            user,
            isOnboarded: user.isOnboarded,
          })
        } catch (error) {
          console.error('OAuth user registration error:', error)
          // フォールバック: 通常のfetchUserを試行
          await get().fetchUser()
        }
      } else {
        throw new Error('認証トークンの取得に失敗しました')
      }
    } else if (result.type === 'cancel') {
      // ユーザーがキャンセルした場合
      throw new Error('ログインがキャンセルされました')
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isOnboarded: false })
  },

  checkSession: async () => {
    set({ isLoading: true })

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        set({ session })
        await get().fetchUser()
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUser: async () => {
    const { session } = get()
    if (!session) return

    try {
      const user = await getCurrentUser()
      set({
        user,
        isOnboarded: user.isOnboarded,
      })
    } catch (error) {
      console.error('Fetch user error:', error)
      // ユーザーがまだ作成されていない場合（初回ログイン）
      set({ isOnboarded: false })
    }
  },

  completeOnboarding: async (data: OnboardingData) => {
    const { session } = get()
    if (!session) throw new Error('Not authenticated')

    const user = await completeOnboardingApi(data)
    set({
      user,
      isOnboarded: true,
    })
  },

  updateUser: (userData: Partial<User>) => {
    const { user } = get()
    if (user) {
      set({ user: { ...user, ...userData } })
    }
  },
}))
