import { api } from './api'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export type RecruitmentStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export interface RecruitmentMember {
  id: string
  nickname: string
  avatarUrl: string | null
  role: 'OWNER' | 'MEMBER'
}

export interface Recruitment {
  id: string
  creatorId?: string
  categoryId?: string
  title: string
  description: string | null
  datetime: string | null
  datetimeFlex: string | null
  latitude: number | null
  longitude: number | null
  landmarkName: string | null
  locationName?: string | null
  minPeople: number
  maxPeople: number
  currentPeople: number
  status: RecruitmentStatus
  area: 'TOKYO' | 'SENDAI'
  createdAt: string
  updatedAt?: string
  category: {
    id: string
    name: string
    icon: string
  }
  creator: {
    id: string
    nickname: string
    avatar?: string | null
    avatarUrl?: string | null
    bio?: string | null
  }
  _count?: {
    applications: number
  }
  // 詳細取得時のみ含まれるフィールド
  members?: RecruitmentMember[]
  isOwner?: boolean
  isParticipating?: boolean
  groupId?: string | null
  hasApplied?: boolean
  applicationStatus?: ApplicationStatus | null
  hasReceivedOffer?: boolean
  offerStatus?: string | null
}

export interface Application {
  id: string
  recruitmentId: string
  applicantId: string
  status: ApplicationStatus
  message: string | null
  createdAt: string
  applicant: {
    id: string
    nickname: string
    avatar: string | null
    bio: string | null
  }
}

export interface CreateRecruitmentData {
  categoryId: string
  title: string
  description?: string
  datetime?: string
  datetimeFlex?: string
  latitude?: number
  longitude?: number
  landmarkName?: string
  minPeople: number
  maxPeople: number
  area: 'TOKYO' | 'SENDAI'
}

interface RecruitmentsResponse {
  success: boolean
  data: {
    items: Recruitment[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

// 募集一覧取得
export const getRecruitments = async (params?: {
  area?: 'TOKYO' | 'SENDAI'
  categoryId?: string
  status?: RecruitmentStatus
  page?: number
  limit?: number
}): Promise<{ recruitments: Recruitment[]; total: number }> => {
  const response = await api.get<RecruitmentsResponse>('/recruitments', { params })
  return {
    recruitments: response.data.data?.items || [],
    total: response.data.data?.pagination?.total || 0,
  }
}

// 募集詳細取得
export const getRecruitment = async (id: string): Promise<Recruitment> => {
  const response = await api.get<ApiResponse<Recruitment>>(`/recruitments/${id}`)
  return response.data.data
}

// 募集作成
export const createRecruitment = async (data: CreateRecruitmentData): Promise<Recruitment> => {
  const response = await api.post<ApiResponse<Recruitment>>('/recruitments', data)
  return response.data.data
}

// 募集更新
export const updateRecruitment = async (
  id: string,
  data: Partial<CreateRecruitmentData & { status: RecruitmentStatus }>
): Promise<Recruitment> => {
  const response = await api.put<ApiResponse<Recruitment>>(`/recruitments/${id}`, data)
  return response.data.data
}

// 募集に応募
export const applyToRecruitment = async (
  id: string,
  message?: string
): Promise<Application> => {
  const response = await api.post<ApiResponse<Application>>(`/recruitments/${id}/applications`, { message })
  return response.data.data
}

// 応募一覧取得
export const getApplications = async (recruitmentId: string): Promise<Application[]> => {
  const response = await api.get<ApiResponse<Application[]>>(`/recruitments/${recruitmentId}/applications`)
  return response.data.data || []
}

// 応募ステータス更新（承認/却下）
export const updateApplicationStatus = async (
  recruitmentId: string,
  applicationId: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<{ id: string; status: string; groupId?: string }> => {
  const action = status === 'APPROVED' ? 'APPROVE' : 'REJECT'
  const response = await api.put<ApiResponse<{ id: string; status: string; groupId?: string }>>(
    `/recruitments/${recruitmentId}/applications/${applicationId}`,
    { action }
  )
  return response.data.data
}

// 募集をキャンセル（削除）
export const cancelRecruitment = async (id: string): Promise<void> => {
  await api.put<ApiResponse<Recruitment>>(`/recruitments/${id}`, { status: 'CANCELLED' })
}

// 募集をクローズ
export const closeRecruitment = async (id: string): Promise<Recruitment> => {
  const response = await api.put<ApiResponse<Recruitment>>(`/recruitments/${id}`, { status: 'CLOSED' })
  return response.data.data
}
