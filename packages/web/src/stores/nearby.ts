import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'
import type { NearbyItem, NearbyResponse } from '@machi/shared'

interface NearbyFilters {
  types: 'all' | 'recruitment' | 'wantToDo'
  categoryIds: string[]
  radius: number
  participatingOnly: boolean // 参加中の募集のみ表示
}

export const useNearbyStore = defineStore('nearby', () => {
  // State
  const items = ref<NearbyItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedItemId = ref<string | null>(null)
  const center = ref<{ lat: number; lng: number } | null>(null)
  const filters = ref<NearbyFilters>({
    types: 'all',
    categoryIds: [],
    radius: 5000, // 5km
    participatingOnly: false,
  })

  // Getters
  const selectedItem = computed(() => {
    if (!selectedItemId.value) return null
    return items.value.find((item) => item.id === selectedItemId.value) || null
  })

  const recruitments = computed(() =>
    items.value.filter((item): item is NearbyItem & { type: 'recruitment' } => item.type === 'recruitment')
  )

  const wantToDos = computed(() =>
    items.value.filter((item): item is NearbyItem & { type: 'wantToDo' } => item.type === 'wantToDo')
  )

  const filteredItems = computed(() => {
    let result = items.value

    if (filters.value.types === 'recruitment') {
      result = result.filter((item) => item.type === 'recruitment')
    } else if (filters.value.types === 'wantToDo') {
      result = result.filter((item) => item.type === 'wantToDo')
    }

    if (filters.value.categoryIds.length > 0) {
      result = result.filter((item) => filters.value.categoryIds.includes(item.category.id))
    }

    // 参加中フィルター
    if (filters.value.participatingOnly) {
      result = result.filter((item) => {
        if (item.type === 'recruitment') {
          return item.isParticipating === true
        }
        return false // 表明は参加中フィルターには含めない
      })
    }

    return result
  })

  // 参加中の募集数
  const participatingCount = computed(() => {
    return items.value.filter(
      (item) => item.type === 'recruitment' && item.isParticipating === true
    ).length
  })

  // Actions
  const fetchNearby = async (lat: number, lng: number) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: filters.value.radius.toString(),
        types: filters.value.types,
      })

      if (filters.value.categoryIds.length > 0) {
        filters.value.categoryIds.forEach((id) => {
          params.append('categoryIds', id)
        })
      }

      const response = await api.get<NearbyResponse>(`/nearby?${params.toString()}`)

      if (response.success && response.data) {
        items.value = response.data.items
        center.value = response.data.center
      } else {
        error.value = response.error?.message || '周辺情報の取得に失敗しました'
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'エラーが発生しました'
    } finally {
      isLoading.value = false
    }
  }

  const fetchByBounds = async (bounds: {
    north: number
    south: number
    east: number
    west: number
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
        types: filters.value.types,
      })

      if (filters.value.categoryIds.length > 0) {
        filters.value.categoryIds.forEach((id) => {
          params.append('categoryIds', id)
        })
      }

      const response = await api.get<NearbyResponse>(`/nearby/bounds?${params.toString()}`)

      if (response.success && response.data) {
        items.value = response.data.items
      } else {
        error.value = response.error?.message || '周辺情報の取得に失敗しました'
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'エラーが発生しました'
    } finally {
      isLoading.value = false
    }
  }

  const selectItem = (id: string | null) => {
    selectedItemId.value = id
  }

  const setFilters = (newFilters: Partial<NearbyFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearItems = () => {
    items.value = []
    selectedItemId.value = null
  }

  return {
    // State
    items,
    isLoading,
    error,
    selectedItemId,
    center,
    filters,
    // Getters
    selectedItem,
    recruitments,
    wantToDos,
    filteredItems,
    participatingCount,
    // Actions
    fetchNearby,
    fetchByBounds,
    selectItem,
    setFilters,
    clearItems,
  }
})
