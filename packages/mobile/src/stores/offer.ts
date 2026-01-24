import { create } from 'zustand'
import {
  Offer,
  SuggestedUser,
  getSuggestions,
  sendOffer,
  getReceivedOffers,
  respondToOffer,
} from '@/services/offer'

interface OfferState {
  // おすすめユーザー
  suggestions: SuggestedUser[]
  isLoadingSuggestions: boolean

  // 受信オファー
  receivedOffers: Offer[]
  isLoadingOffers: boolean

  // 送信状態
  isSendingOffer: boolean
  isRespondingOffer: boolean

  error: string | null

  // Actions
  fetchSuggestions: (recruitmentId: string) => Promise<void>
  sendOffer: (recruitmentId: string, receiverId: string, message?: string) => Promise<void>
  fetchReceivedOffers: () => Promise<void>
  respondToOffer: (
    recruitmentId: string,
    offerId: string,
    action: 'ACCEPT' | 'DECLINE'
  ) => Promise<void>
  clearError: () => void
  clearSuggestions: () => void
}

export const useOfferStore = create<OfferState>((set, get) => ({
  suggestions: [],
  isLoadingSuggestions: false,
  receivedOffers: [],
  isLoadingOffers: false,
  isSendingOffer: false,
  isRespondingOffer: false,
  error: null,

  fetchSuggestions: async (recruitmentId: string) => {
    set({ isLoadingSuggestions: true, error: null })
    try {
      const suggestions = await getSuggestions(recruitmentId)
      set({ suggestions, isLoadingSuggestions: false })
    } catch (error: any) {
      set({
        error: error.message || 'おすすめユーザーの取得に失敗しました',
        isLoadingSuggestions: false,
      })
    }
  },

  sendOffer: async (recruitmentId: string, receiverId: string, message?: string) => {
    set({ isSendingOffer: true, error: null })
    try {
      await sendOffer(recruitmentId, receiverId, message)
      // おすすめリストから送信済みユーザーを除外
      set((state) => ({
        suggestions: state.suggestions.filter((s) => s.user.id !== receiverId),
        isSendingOffer: false,
      }))
    } catch (error: any) {
      set({
        error: error.message || 'オファーの送信に失敗しました',
        isSendingOffer: false,
      })
      throw error
    }
  },

  fetchReceivedOffers: async () => {
    set({ isLoadingOffers: true, error: null })
    try {
      const offers = await getReceivedOffers()
      set({ receivedOffers: offers, isLoadingOffers: false })
    } catch (error: any) {
      set({
        error: error.message || 'オファーの取得に失敗しました',
        isLoadingOffers: false,
      })
    }
  },

  respondToOffer: async (
    recruitmentId: string,
    offerId: string,
    action: 'ACCEPT' | 'DECLINE'
  ) => {
    set({ isRespondingOffer: true, error: null })
    try {
      const result = await respondToOffer(recruitmentId, offerId, action)
      // オファー一覧を更新
      set((state) => ({
        receivedOffers: state.receivedOffers.map((offer) =>
          offer.id === offerId
            ? { ...offer, status: result.status, respondedAt: result.respondedAt }
            : offer
        ),
        isRespondingOffer: false,
      }))
    } catch (error: any) {
      set({
        error: error.message || 'オファーへの応答に失敗しました',
        isRespondingOffer: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSuggestions: () => set({ suggestions: [] }),
}))
