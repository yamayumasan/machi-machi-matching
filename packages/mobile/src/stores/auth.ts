import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_URL } from '@/constants'
import axios from 'axios'

// Supabase クライアント
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// ユーザー型（API から取得）
interface User {
  id: string
  email: string
  nickname: string | null
  avatar: string | null
  bio: string | null
  area: 'TOKYO' | 'SENDAI' | null
  latitude: number | null
  longitude: number | null
  isOnboarded: boolean
}

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isOnboarded: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  fetchUser: () => Promise<void>
  completeOnboarding: (data: OnboardingData) => Promise<void>
}

interface OnboardingData {
  nickname: string
  bio?: string
  area: 'TOKYO' | 'SENDAI'
  categoryIds: string[]
  latitude?: number
  longitude?: number
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
      const response = await axios.get<User>(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const user = response.data
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

    const response = await axios.post<User>(
      `${API_URL}/users/onboarding`,
      data,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    )

    set({
      user: response.data,
      isOnboarded: true,
    })
  },
}))
