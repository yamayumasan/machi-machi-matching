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
  /** 「今すぐ」対応可能（TODAY タイミングのやりたいことあり） */
  isAvailableNow?: boolean
  /** 過去にマッチングした相手かどうか */
  isPastMatch?: boolean
  /** 過去のマッチング回数 */
  matchCount?: number
  /** 同じカテゴリでのマッチング回数 */
  sameCategoryMatchCount?: number
}

export interface PastMatchUser {
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
    bio: string | null
    area: string | null
  }
  matchCount: number
  lastMatchedAt: string
  categories: string[]
  lastRecruitment: {
    id: string
    title: string
    datetime: string | null
    category: {
      id: string
      name: string
      icon: string
    }
  }
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

// 過去マッチング相手一覧取得
export const getPastMatches = async (categoryId?: string): Promise<PastMatchUser[]> => {
  const params = categoryId ? { categoryId } : {}
  const response = await api.get<ApiResponse<{ items: PastMatchUser[]; total: number }>>(
    '/recruitments/me/past-matches',
    { params }
  )
  return response.data.data.items || []
}

// 募集に対して過去のマッチング相手を優先表示
export const getPastMatchSuggestions = async (recruitmentId: string): Promise<SuggestedUser[]> => {
  const response = await api.get<ApiResponse<SuggestedUser[]>>(
    `/recruitments/${recruitmentId}/suggestions/past-matches`
  )
  return response.data.data || []
}
