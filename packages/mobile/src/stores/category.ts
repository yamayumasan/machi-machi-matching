import { create } from 'zustand'
import { Category, getCategories } from '@/services/category'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchCategories: () => Promise<void>
  getCategoryById: (id: string) => Category | undefined
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    // 既にカテゴリがある場合はスキップ
    if (get().categories.length > 0) return

    set({ isLoading: true, error: null })
    try {
      const categories = await getCategories()
      set({ categories: categories || [], isLoading: false })
    } catch (error: any) {
      console.log('fetchCategories error:', error)
      set({
        categories: [],
        error: error.message || 'カテゴリの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  getCategoryById: (id: string) => {
    return get().categories.find((c) => c.id === id)
  },
}))
