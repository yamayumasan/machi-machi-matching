import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { createClient, Session } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import * as AppleAuthentication from 'expo-apple-authentication'
import { Platform } from 'react-native'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants'
import { config, isDev } from '@/config/env'
import {
  getCurrentUser,
  completeOnboarding as completeOnboardingApi,
  registerOAuthUser,
  deleteAccount as deleteAccountApi,
  User,
  OnboardingData,
} from '@/services/auth'

// WebBrowserの完了ハンドリングを有効化
WebBrowser.maybeCompleteAuthSession()

// 開発モード用のモックセッション
const createDevMockSession = (): Session => ({
  access_token: 'dev-access-token',
  refresh_token: 'dev-refresh-token',
  expires_in: 3600 * 24 * 365, // 1年
  expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  token_type: 'bearer',
  user: {
    id: config.dev.mockUser.id,
    email: config.dev.mockUser.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  },
})

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

interface SignUpResult {
  needsEmailConfirmation: boolean
}

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isOnboarded: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
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
    console.log('[AUTH] signIn: starting...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log('[AUTH] signIn: Supabase error:', error.message)
      throw error
    }

    console.log('[AUTH] signIn: Supabase success, user id:', data.user?.id)
    console.log('[AUTH] signIn: session exists:', !!data.session)
    set({ session: data.session })
    await get().fetchUser()
    console.log('[AUTH] signIn: completed, state:', {
      user: get().user?.id,
      isOnboarded: get().isOnboarded,
    })
  },

  signUp: async (email: string, password: string): Promise<SignUpResult> => {
    console.log('[AUTH] signUp: starting with email:', email)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('[AUTH] signUp: response:', {
      user: data.user?.id,
      email: data.user?.email,
      session: !!data.session,
      error: error?.message,
      // ユーザーの確認状態
      emailConfirmedAt: data.user?.email_confirmed_at,
      confirmationSentAt: data.user?.confirmation_sent_at,
    })

    if (error) {
      console.error('[AUTH] signUp: error:', error)
      throw error
    }

    // メール確認が必要な場合、session は null
    if (data.session) {
      console.log('[AUTH] signUp: session exists, no email confirmation needed')
      set({ session: data.session })
      await get().fetchUser()
      return { needsEmailConfirmation: false }
    }

    // メール確認が必要
    console.log('[AUTH] signUp: no session, email confirmation required')
    return { needsEmailConfirmation: true }
  },

  signInWithGoogle: async () => {
    // Expo Go用のリダイレクトURLを作成
    const redirectUrl = AuthSession.makeRedirectUri({
      // Expo Goでは scheme を指定しない（exp:// が自動的に使われる）
      path: 'auth/callback',
    })

    console.log('Redirect URL:', redirectUrl)

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

    console.log('OAuth URL:', data.url)

    // ブラウザでOAuth認証を開始
    // dismissButtonStyle: 'close' でiOSのSafariViewControllerを使用
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl,
      {
        preferEphemeralSession: true, // Cookieを保持しない（毎回ログイン選択画面を表示）
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

  signInWithApple: async () => {
    // iOSのみサポート
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS')
    }

    // Apple認証が利用可能か確認
    const isAvailable = await AppleAuthentication.isAvailableAsync()
    if (!isAvailable) {
      throw new Error('Sign in with Apple is not available on this device')
    }

    try {
      // Apple認証を実行
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      console.log('[AUTH] Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken ? 'exists' : 'null',
      })

      if (!credential.identityToken) {
        throw new Error('Apple認証トークンの取得に失敗しました')
      }

      // SupabaseにApple認証トークンを送信
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })

      if (error) {
        console.error('[AUTH] Supabase Apple auth error:', error)
        throw error
      }

      console.log('[AUTH] Supabase Apple auth success:', {
        userId: data.user?.id,
        email: data.user?.email,
        session: !!data.session,
      })

      set({ session: data.session })

      // バックエンドにOAuthコールバックを通知してDBにユーザーを作成/取得
      if (data.session) {
        try {
          const user = await registerOAuthUser(
            data.session.access_token,
            data.session.refresh_token
          )
          set({
            user,
            isOnboarded: user.isOnboarded,
          })
        } catch (error) {
          console.error('[AUTH] Apple OAuth user registration error:', error)
          // フォールバック: 通常のfetchUserを試行
          await get().fetchUser()
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('ログインがキャンセルされました')
      }
      throw error
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isOnboarded: false })
  },

  deleteAccount: async () => {
    console.log('[AUTH] deleteAccount: starting...')
    try {
      await deleteAccountApi()
      console.log('[AUTH] deleteAccount: API success')
      await supabase.auth.signOut()
      set({ user: null, session: null, isOnboarded: false })
      console.log('[AUTH] deleteAccount: completed')
    } catch (error: any) {
      console.error('[AUTH] deleteAccount: error:', error?.response?.data || error.message)
      throw error
    }
  },

  checkSession: async () => {
    set({ isLoading: true })

    // 開発モード: 自動ログイン
    if (isDev && config.dev.autoLogin) {
      console.log('[AUTH] DEV MODE: Auto-login enabled')
      const mockSession = createDevMockSession()
      set({ session: mockSession })

      // APIから実際のユーザーデータを取得
      try {
        console.log('[AUTH] DEV MODE: Fetching user from API...')
        const user = await getCurrentUser()
        set({
          user,
          isOnboarded: user.isOnboarded,
          isLoading: false,
        })
        console.log('[AUTH] DEV MODE: Logged in as', user.email)
      } catch (error: any) {
        console.error('[AUTH] DEV MODE: Failed to fetch user:', error?.message)
        // フォールバック: モックユーザーを使用
        const mockUser = config.dev.mockUser
        set({
          user: mockUser,
          isOnboarded: mockUser.isOnboarded,
          isLoading: false,
        })
        console.log('[AUTH] DEV MODE: Using fallback mock user')
      }
      return
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        // トークンが無効な場合はセッションをクリア
        console.log('Session error, clearing session:', error.message)
        await supabase.auth.signOut()
        set({ session: null, user: null, isOnboarded: false })
        return
      }

      if (session) {
        set({ session })
        await get().fetchUser()
      }
    } catch (error) {
      console.error('Session check error:', error)
      // エラー時はセッションをクリア
      await supabase.auth.signOut()
      set({ session: null, user: null, isOnboarded: false })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUser: async () => {
    console.log('[AUTH] fetchUser: starting...')
    const { session } = get()
    if (!session) {
      console.log('[AUTH] fetchUser: no session, returning early')
      return
    }
    console.log('[AUTH] fetchUser: session exists, access_token prefix:', session.access_token?.substring(0, 20))

    try {
      console.log('[AUTH] fetchUser: calling getCurrentUser API...')
      const user = await getCurrentUser()
      console.log('[AUTH] fetchUser: API success, user:', {
        id: user.id,
        email: user.email,
        isOnboarded: user.isOnboarded,
      })
      set({
        user,
        isOnboarded: user.isOnboarded,
      })
      console.log('[AUTH] fetchUser: state updated')
    } catch (error: any) {
      console.error('[AUTH] fetchUser: API error:', error?.response?.status, error?.response?.data || error.message)

      // 404の場合、DBにユーザーが存在しない → OAuth callback APIでユーザーを作成
      if (error?.response?.status === 404) {
        console.log('[AUTH] fetchUser: User not found in DB, creating via OAuth callback...')
        try {
          const user = await registerOAuthUser(
            session.access_token,
            session.refresh_token
          )
          console.log('[AUTH] fetchUser: User created via OAuth callback:', {
            id: user.id,
            email: user.email,
            isOnboarded: user.isOnboarded,
          })
          set({
            user,
            isOnboarded: user.isOnboarded,
          })
          return
        } catch (createError: any) {
          console.error('[AUTH] fetchUser: Failed to create user:', createError?.response?.data || createError.message)
          // ユーザー作成も失敗した場合、セッションをクリアして再ログインを促す
          console.log('[AUTH] fetchUser: Clearing invalid session...')
          await supabase.auth.signOut()
          set({ session: null, user: null, isOnboarded: false })
          return
        }
      }

      // 401の場合、トークンが無効 → セッションをクリア
      if (error?.response?.status === 401) {
        console.log('[AUTH] fetchUser: Token invalid, clearing session...')
        await supabase.auth.signOut()
        set({ session: null, user: null, isOnboarded: false })
        return
      }

      // その他のエラー
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
