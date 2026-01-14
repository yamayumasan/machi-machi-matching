import { create } from 'zustand'
import {
  NearbyItem,
  NearbyFilterType,
  getNearby,
  getNearbyByBounds,
} from '@/services/nearby'

interface NearbyState {
  items: NearbyItem[]
  selectedItem: NearbyItem | null
  filterType: NearbyFilterType
  selectedCategoryIds: string[]
  isLoading: boolean
  error: string | null
  center: { lat: number; lng: number } | null
  lastBounds: { north: number; south: number; east: number; west: number } | null

  // Computed-like getters
  getFilteredItems: () => NearbyItem[]

  // Actions
  fetchNearby: (lat: number, lng: number, radius?: number) => Promise<void>
  fetchByBounds: (bounds: { north: number; south: number; east: number; west: number }) => Promise<void>
  setFilterType: (type: NearbyFilterType) => void
  setSelectedCategories: (categoryIds: string[]) => void
  selectItem: (item: NearbyItem | null) => void
  selectItemById: (id: string | null) => void
  setCenter: (center: { lat: number; lng: number }) => void
  clearError: () => void
}

export const useNearbyStore = create<NearbyState>((set, get) => ({
  items: [],
  selectedItem: null,
  filterType: 'all',
  selectedCategoryIds: [],
  isLoading: false,
  error: null,
  center: null,
  lastBounds: null,

  // クライアント側フィルタリング
  getFilteredItems: () => {
    const { items, filterType, selectedCategoryIds } = get()

    return items.filter((item) => {
      // タイプフィルター
      if (filterType === 'recruitment' && item.type !== 'recruitment') {
        return false
      }
      if (filterType === 'wantToDo' && item.type !== 'wantToDo') {
        return false
      }

      // カテゴリフィルター
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(item.category.id)) {
        return false
      }

      return true
    })
  },

  fetchNearby: async (lat: number, lng: number, radius = 5000) => {
    set({ isLoading: true, error: null })
    try {
      // APIではフィルターなしで全データを取得（クライアント側でフィルタリング）
      const result = await getNearby({
        lat,
        lng,
        radius,
        types: 'all',
        limit: 100,
      })
      set({
        items: result.items || [],
        center: { lat, lng },
        isLoading: false,
      })
    } catch (error: any) {
      console.log('fetchNearby error:', error)
      set({
        items: [],
        error: error.message || '周辺情報の取得に失敗しました',
        isLoading: false,
      })
    }
  },

  fetchByBounds: async (bounds) => {
    const { lastBounds } = get()

    // 前回の取得範囲から30%以上変化した場合のみ再取得
    if (lastBounds) {
      const latChange = Math.abs(bounds.north - lastBounds.north) / (lastBounds.north - lastBounds.south)
      const lngChange = Math.abs(bounds.east - lastBounds.east) / (lastBounds.east - lastBounds.west)
      if (latChange < 0.3 && lngChange < 0.3) {
        return // 変化が小さいのでスキップ
      }
    }

    set({ isLoading: true, error: null })
    try {
      // 範囲を20%拡大して取得（小さな移動での再取得を防止）
      const latPadding = (bounds.north - bounds.south) * 0.2
      const lngPadding = (bounds.east - bounds.west) * 0.2
      const paddedBounds = {
        north: bounds.north + latPadding,
        south: bounds.south - latPadding,
        east: bounds.east + lngPadding,
        west: bounds.west - lngPadding,
      }

      const result = await getNearbyByBounds({
        ...paddedBounds,
        types: 'all',
        limit: 100,
      })
      set({
        items: result.items || [],
        lastBounds: paddedBounds,
        isLoading: false,
      })
    } catch (error: any) {
      console.log('fetchByBounds error:', error)
      set({
        error: error.message || '周辺情報の取得に失敗しました',
        isLoading: false,
      })
    }
  },

  setFilterType: (type: NearbyFilterType) => {
    set({ filterType: type })
  },

  setSelectedCategories: (categoryIds: string[]) => {
    set({ selectedCategoryIds: categoryIds })
  },

  selectItem: (item: NearbyItem | null) => {
    set({ selectedItem: item })
  },

  selectItemById: (id: string | null) => {
    if (!id) {
      set({ selectedItem: null })
      return
    }
    const { items } = get()
    const item = items.find((i) => i.id === id) || null
    set({ selectedItem: item })
  },

  setCenter: (center: { lat: number; lng: number }) => {
    set({ center })
  },

  clearError: () => set({ error: null }),
}))
