import { create } from 'zustand'
import {
  Recruitment,
  CreateRecruitmentData,
  getRecruitments,
  getRecruitment,
  createRecruitment,
  applyToRecruitment,
} from '@/services/recruitment'

interface RecruitmentState {
  recruitments: Recruitment[]
  selectedRecruitment: Recruitment | null
  isLoading: boolean
  error: string | null
  total: number
  page: number

  // Actions
  fetchRecruitments: (params?: {
    area?: 'TOKYO' | 'SENDAI'
    categoryId?: string
    page?: number
  }) => Promise<void>
  fetchRecruitment: (id: string) => Promise<void>
  addRecruitment: (data: CreateRecruitmentData) => Promise<Recruitment>
  apply: (id: string, message?: string) => Promise<void>
  setSelectedRecruitment: (recruitment: Recruitment | null) => void
  clearError: () => void
}

export const useRecruitmentStore = create<RecruitmentState>((set, get) => ({
  recruitments: [],
  selectedRecruitment: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,

  fetchRecruitments: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const result = await getRecruitments({
        ...params,
        limit: 20,
      })
      set({
        recruitments: result?.recruitments || [],
        total: result?.total || 0,
        page: params?.page || 1,
        isLoading: false,
      })
    } catch (error: any) {
      console.log('fetchRecruitments error:', error)
      set({
        recruitments: [],
        total: 0,
        error: error.message || '募集の取得に失敗しました',
        isLoading: false,
      })
    }
  },

  fetchRecruitment: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const recruitment = await getRecruitment(id)
      set({ selectedRecruitment: recruitment, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || '募集の取得に失敗しました',
        isLoading: false,
      })
    }
  },

  addRecruitment: async (data: CreateRecruitmentData) => {
    const recruitment = await createRecruitment(data)
    set({ recruitments: [recruitment, ...get().recruitments] })
    return recruitment
  },

  apply: async (id: string, message?: string) => {
    await applyToRecruitment(id, message)
    // 応募後に募集を再取得して状態を更新
    await get().fetchRecruitment(id)
  },

  setSelectedRecruitment: (recruitment: Recruitment | null) => {
    set({ selectedRecruitment: recruitment })
  },

  clearError: () => set({ error: null }),
}))
