import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'

interface AuthUser {
  id: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  bio?: string | null
  area: string | null
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  isOnboarded: boolean
  interests: Array<{ id: string; name: string }>
}

interface Session {
  accessToken: string
  refreshToken: string
  expiresAt?: number
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'machi_access_token',
  REFRESH_TOKEN: 'machi_refresh_token',
  USER: 'machi_user',
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!session.value?.accessToken && !!user.value)
  const isOnboarded = computed(() => user.value?.isOnboarded ?? false)
  const needsOnboarding = computed(() => isAuthenticated.value && !isOnboarded.value)

  // Actions
  const setSession = (newSession: Session | null) => {
    session.value = newSession
    if (newSession) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newSession.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newSession.refreshToken)
      api.setAccessToken(newSession.accessToken)
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      api.setAccessToken(null)
    }
  }

  const setUser = (newUser: AuthUser | null) => {
    user.value = newUser
    if (newUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser))
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  }

  const initialize = async () => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

    if (!accessToken || !refreshToken) {
      return
    }

    session.value = { accessToken, refreshToken }
    api.setAccessToken(accessToken)

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        // Invalid stored user
      }
    }

    // Verify token and get fresh user data
    await fetchCurrentUser()
  }

  const signUp = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{
        message: string
        user: AuthUser
      }>('/auth/signup', { email, password })

      if (!response.success) {
        error.value = response.error?.message || 'Registration failed'
        return false
      }

      // After signup, user needs to sign in
      return true
    } finally {
      isLoading.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{
        user: AuthUser
        session: Session
      }>('/auth/signin', { email, password })

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Login failed'
        return false
      }

      setSession(response.data.session)
      setUser(response.data.user)
      return true
    } finally {
      isLoading.value = false
    }
  }

  const signOut = async () => {
    isLoading.value = true
    error.value = null

    try {
      await api.post('/auth/signout')
    } finally {
      setSession(null)
      setUser(null)
      isLoading.value = false
    }
  }

  const signInWithGoogle = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ url: string }>('/auth/oauth/google')

      if (!response.success || !response.data?.url) {
        error.value = response.error?.message || 'Failed to get OAuth URL'
        return
      }

      // Redirect to Google OAuth
      window.location.href = response.data.url
    } finally {
      isLoading.value = false
    }
  }

  const handleOAuthCallback = async (accessToken: string, refreshToken: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{
        user: AuthUser
        session: Session
      }>('/auth/oauth/callback', { accessToken, refreshToken })

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'OAuth callback failed'
        return false
      }

      setSession({
        accessToken,
        refreshToken,
      })
      setUser(response.data.user)
      return true
    } finally {
      isLoading.value = false
    }
  }

  const refreshSession = async () => {
    const refreshToken = session.value?.refreshToken
    if (!refreshToken) {
      return false
    }

    try {
      const response = await api.post<{ session: Session }>('/auth/refresh', {
        refreshToken,
      })

      if (!response.success || !response.data) {
        setSession(null)
        setUser(null)
        return false
      }

      setSession(response.data.session)
      return true
    } catch {
      setSession(null)
      setUser(null)
      return false
    }
  }

  const fetchCurrentUser = async () => {
    if (!session.value?.accessToken) {
      return
    }

    try {
      const response = await api.get<{ user: AuthUser }>('/auth/me')

      if (!response.success || !response.data) {
        // Token might be expired, try to refresh
        const refreshed = await refreshSession()
        if (refreshed) {
          // Retry fetching user
          const retryResponse = await api.get<{ user: AuthUser }>('/auth/me')
          if (retryResponse.success && retryResponse.data) {
            setUser(retryResponse.data.user)
          } else {
            setSession(null)
            setUser(null)
          }
        }
        return
      }

      setUser(response.data.user)
    } catch {
      setSession(null)
      setUser(null)
    }
  }

  const completeOnboarding = async (data: {
    nickname: string
    bio?: string | null
    area: string
    categoryIds: string[]
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<AuthUser>('/users/me/onboarding', data)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Onboarding failed'
        return false
      }

      setUser(response.data)
      return true
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (data: {
    nickname?: string
    bio?: string | null
    area?: string
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put<AuthUser>('/users/me', data)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Profile update failed'
        return false
      }

      if (user.value) {
        user.value = { ...user.value, ...response.data }
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user.value))
      }
      return true
    } finally {
      isLoading.value = false
    }
  }

  const updateCategories = async (categoryIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put<Array<{ id: string; name: string }>>('/users/me/categories', {
        categoryIds,
      })

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Categories update failed'
        return false
      }

      if (user.value) {
        user.value.interests = response.data
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user.value))
      }
      return true
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    session,
    isLoading,
    error,
    // Computed
    isAuthenticated,
    isOnboarded,
    needsOnboarding,
    // Actions
    initialize,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    handleOAuthCallback,
    refreshSession,
    fetchCurrentUser,
    completeOnboarding,
    updateProfile,
    updateCategories,
  }
})
