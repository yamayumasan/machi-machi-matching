import { api } from './api'

export type RecruitmentStatus = 'OPEN' | 'CLOSED' | 'COMPLETED' | 'CANCELLED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export interface Recruitment {
  id: string
  creatorId: string
  categoryId: string
  title: string
  description: string | null
  datetime: string | null
  datetimeFlex: string | null
  latitude: number | null
  longitude: number | null
  landmarkName: string | null
  minPeople: number
  maxPeople: number
  currentPeople: number
  status: RecruitmentStatus
  area: 'TOKYO' | 'SENDAI'
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    icon: string
  }
  creator: {
    id: string
    nickname: string
    avatar: string | null
  }
  _count?: {
    applications: number
  }
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

// 募集一覧取得
export const getRecruitments = async (params?: {
  area?: 'TOKYO' | 'SENDAI'
  categoryId?: string
  status?: RecruitmentStatus
  page?: number
  limit?: number
}): Promise<{ recruitments: Recruitment[]; total: number }> => {
  const response = await api.get('/recruitments', { params })
  return response.data
}

// 募集詳細取得
export const getRecruitment = async (id: string): Promise<Recruitment> => {
  const response = await api.get<Recruitment>(`/recruitments/${id}`)
  return response.data
}

// 募集作成
export const createRecruitment = async (data: CreateRecruitmentData): Promise<Recruitment> => {
  const response = await api.post<Recruitment>('/recruitments', data)
  return response.data
}

// 募集更新
export const updateRecruitment = async (
  id: string,
  data: Partial<CreateRecruitmentData & { status: RecruitmentStatus }>
): Promise<Recruitment> => {
  const response = await api.put<Recruitment>(`/recruitments/${id}`, data)
  return response.data
}

// 募集に応募
export const applyToRecruitment = async (
  id: string,
  message?: string
): Promise<Application> => {
  const response = await api.post<Application>(`/recruitments/${id}/applications`, { message })
  return response.data
}

// 応募一覧取得
export const getApplications = async (recruitmentId: string): Promise<Application[]> => {
  const response = await api.get<Application[]>(`/recruitments/${recruitmentId}/applications`)
  return response.data
}

// 応募ステータス更新
export const updateApplicationStatus = async (
  recruitmentId: string,
  applicationId: string,
  status: ApplicationStatus
): Promise<Application> => {
  const response = await api.put<Application>(
    `/recruitments/${recruitmentId}/applications/${applicationId}/status`,
    { status }
  )
  return response.data
}
