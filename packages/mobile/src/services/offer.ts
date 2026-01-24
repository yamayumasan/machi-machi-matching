import { api } from './api'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export interface SuggestedUser {
  user: {
    id: string
    nickname: string
    avatarUrl: string | null
    bio: string | null
  }
  score: number
  hasActiveWantToDo: boolean
  wantToDo?: {
    id: string
    comment: string | null
    timing: string
  }
  matchedCategories: string[]
}

export interface Offer {
  id: string
  status: OfferStatus
  message: string | null
  createdAt: string
  respondedAt: string | null
  recruitment: {
    id: string
    title: string
    category: {
      id: string
      name: string
      icon: string
    }
    creator: {
      id: string
      nickname: string
      avatarUrl: string | null
    }
  }
}

// おすすめユーザー一覧取得
export const getSuggestions = async (recruitmentId: string): Promise<SuggestedUser[]> => {
  const response = await api.get<ApiResponse<SuggestedUser[]>>(
    `/recruitments/${recruitmentId}/suggestions`
  )
  return response.data.data || []
}

// オファー送信
export const sendOffer = async (
  recruitmentId: string,
  receiverId: string,
  message?: string
): Promise<{ id: string; status: OfferStatus }> => {
  const response = await api.post<ApiResponse<{ id: string; status: OfferStatus }>>(
    `/recruitments/${recruitmentId}/offer`,
    { receiverId, message }
  )
  return response.data.data
}

// 受信オファー一覧取得
export const getReceivedOffers = async (): Promise<Offer[]> => {
  const response = await api.get<ApiResponse<Offer[]>>('/recruitments/me/offers')
  return response.data.data || []
}

// オファーに応答
export const respondToOffer = async (
  recruitmentId: string,
  offerId: string,
  action: 'ACCEPT' | 'DECLINE'
): Promise<{ id: string; status: OfferStatus; respondedAt: string }> => {
  const response = await api.put<
    ApiResponse<{ id: string; status: OfferStatus; respondedAt: string }>
  >(`/recruitments/${recruitmentId}/offers/${offerId}`, { action })
  return response.data.data
}
