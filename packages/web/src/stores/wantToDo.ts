import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'

interface Category {
  id: string
  name: string
  icon: string
}

interface WantToDoUser {
  id: string
  nickname: string | null
  avatarUrl: string | null
  area: string | null
  bio?: string | null
}

interface WantToDo {
  id: string
  timing: string
  comment: string | null
  status?: string
  expiresAt: string
  createdAt: string
  category: Category
  user?: WantToDoUser
  isOwner?: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const useWantToDoStore = defineStore('wantToDo', () => {
  // State
  const wantToDos = ref<WantToDo[]>([])
  const myWantToDos = ref<WantToDo[]>([])
  const suggestions = ref<WantToDo[]>([])
  const currentWantToDo = ref<WantToDo | null>(null)
  const pagination = ref<Pagination | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const fetchWantToDos = async (params?: {
    page?: number
    limit?: number
    categoryId?: string
    area?: string
    timing?: string
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', String(params.page))
      if (params?.limit) queryParams.set('limit', String(params.limit))
      if (params?.categoryId) queryParams.set('categoryId', params.categoryId)
      if (params?.area) queryParams.set('area', params.area)
      if (params?.timing) queryParams.set('timing', params.timing)

      const endpoint = `/want-to-dos${queryParams.toString() ? `?${queryParams}` : ''}`
      const response = await api.get<{
        items: WantToDo[]
        pagination: Pagination
      }>(endpoint)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch want-to-dos'
        return false
      }

      wantToDos.value = response.data.items
      pagination.value = response.data.pagination
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchMyWantToDos = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<WantToDo[]>('/want-to-dos/me')

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch my want-to-dos'
        return false
      }

      myWantToDos.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchSuggestions = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ items: WantToDo[] }>('/want-to-dos/matching/suggestions')

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch suggestions'
        return false
      }

      suggestions.value = response.data.items
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchWantToDo = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<WantToDo>(`/want-to-dos/${id}`)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch want-to-do'
        return false
      }

      currentWantToDo.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const createWantToDo = async (data: {
    categoryId: string
    timing: string
    comment?: string | null
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<WantToDo>('/want-to-dos', data)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to create want-to-do'
        return null
      }

      myWantToDos.value.unshift(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  const updateWantToDo = async (
    id: string,
    data: {
      timing?: string
      comment?: string | null
    }
  ) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put<WantToDo>(`/want-to-dos/${id}`, data)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to update want-to-do'
        return false
      }

      // Update in myWantToDos
      const index = myWantToDos.value.findIndex((w) => w.id === id)
      if (index !== -1) {
        myWantToDos.value[index] = response.data
      }

      // Update currentWantToDo if viewing
      if (currentWantToDo.value?.id === id) {
        currentWantToDo.value = response.data
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const deleteWantToDo = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.delete(`/want-to-dos/${id}`)

      if (!response.success) {
        error.value = response.error?.message || 'Failed to delete want-to-do'
        return false
      }

      // Remove from myWantToDos
      myWantToDos.value = myWantToDos.value.filter((w) => w.id !== id)

      // Clear currentWantToDo if viewing
      if (currentWantToDo.value?.id === id) {
        currentWantToDo.value = null
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Computed
  const activeWantToDos = computed(() =>
    myWantToDos.value.filter(
      (w) => w.status === 'ACTIVE' && new Date(w.expiresAt) > new Date()
    )
  )

  return {
    // State
    wantToDos,
    myWantToDos,
    suggestions,
    currentWantToDo,
    pagination,
    isLoading,
    error,
    // Computed
    activeWantToDos,
    // Actions
    fetchWantToDos,
    fetchMyWantToDos,
    fetchSuggestions,
    fetchWantToDo,
    createWantToDo,
    updateWantToDo,
    deleteWantToDo,
    clearError,
  }
})
